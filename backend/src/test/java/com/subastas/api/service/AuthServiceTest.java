package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Empleado;
import com.subastas.api.domain.Persona;
import com.subastas.api.domain.RegistroPendiente;
import com.subastas.api.domain.Token;
import com.subastas.api.domain.Usuario;
import com.subastas.api.dto.ForgotPasswordRequest;
import com.subastas.api.dto.LoginRequest;
import com.subastas.api.dto.RegisterRequest;
import com.subastas.api.dto.RegisterResponse;
import com.subastas.api.dto.ResetPasswordRequest;
import com.subastas.api.dto.VerifyEmailRequest;
import com.subastas.api.repository.*;
import com.subastas.api.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests del codigo real de AuthService (repositorios mockeados). Cubren el flujo
 * de registro en dos fases (staging en registrosPendientes, atado por token),
 * login, verificacion de email y recuperacion de contrasenia. Correr: mvn test
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock UsuarioRepository usuarioRepo;
    @Mock PersonaRepository personaRepo;
    @Mock ClienteRepository clienteRepo;
    @Mock EmpleadoRepository empleadoRepo;
    @Mock PaisRepository paisRepo;
    @Mock TokenRepository tokenRepo;
    @Mock RegistroPendienteRepository pendingRepo;
    @Mock PasswordEncoder encoder;
    @Mock JwtService jwtService;
    @Mock EmailService emailService;

    @InjectMocks AuthService authService;

    private RegisterRequest registro() {
        return new RegisterRequest("Juan", "Perez", "30123456", "Calle 1",
                1, "juan@email.com", null, null);
    }

    private RegistroPendiente pendiente(String codigo, LocalDateTime expira) {
        RegistroPendiente p = new RegistroPendiente();
        p.setId(7);
        p.setToken("tok-7");
        p.setEmail("juan@email.com");
        p.setDocumento("30123456");
        p.setNombre("Juan");
        p.setApellido("Perez");
        p.setDireccion("Calle 1");
        p.setPaisOrigen(1);
        p.setPasswordHash("hash");
        p.setCodigo(codigo);
        p.setExpira(expira);
        return p;
    }

    // ----------------------------- REGISTER -----------------------------

    @Test
    void register_emailYaRegistrado_lanza409() {
        when(usuarioRepo.existsByEmail("juan@email.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registro()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo(ErrorCodes.EMAIL_ALREADY_REGISTERED);
                    assertThat(ex.getStatus().value()).isEqualTo(409);
                });
    }

    @Test
    void register_documentoYaRegistrado_lanza409() {
        when(usuarioRepo.existsByEmail(any())).thenReturn(false);
        when(personaRepo.existsByDocumento("30123456")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registro()))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.DOCUMENT_ALREADY_REGISTERED));
    }

    @Test
    void register_paisInexistente_lanza422() {
        when(usuarioRepo.existsByEmail(any())).thenReturn(false);
        when(personaRepo.existsByDocumento(any())).thenReturn(false);
        when(paisRepo.existsById(1)).thenReturn(false);

        assertThatThrownBy(() -> authService.register(registro()))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo(ErrorCodes.INVALID_COUNTRY);
                    assertThat(ex.getStatus().value()).isEqualTo(422);
                });
    }

    @Test
    void register_ok_guardaPendienteConTokenYNoTocaTablasReales() {
        when(usuarioRepo.existsByEmail(any())).thenReturn(false);
        when(personaRepo.existsByDocumento(any())).thenReturn(false);
        when(paisRepo.existsById(1)).thenReturn(true);
        when(pendingRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(encoder.encode(any())).thenReturn("hash");
        when(emailService.isDevMode()).thenReturn(true);

        RegisterResponse res = authService.register(registro());

        assertThat(res.status()).isEqualTo("pending_verification");
        assertThat(res.provisionalPassword()).startsWith("BIDSTER-");
        assertThat(res.devCode()).matches("\\d{6}");           // codigo de 6 digitos en modo dev
        assertThat(res.registrationId()).isNotBlank();          // token opaco

        // El fix: NO se crea nada en personas/usuarios/clientes hasta verificar.
        verify(personaRepo, never()).save(any());
        verify(usuarioRepo, never()).save(any());
        verify(clienteRepo, never()).save(any());
        verify(pendingRepo).save(any());
    }

    // ------------------------------ LOGIN -------------------------------

    @Test
    void login_emailInexistente_lanza401() {
        when(usuarioRepo.findByEmail("x@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("x@x.com", "Password123!")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo(ErrorCodes.INVALID_CREDENTIALS);
                    assertThat(ex.getStatus().value()).isEqualTo(401);
                });
    }

    @Test
    void login_passwordIncorrecta_lanza401() {
        Usuario u = new Usuario();
        u.setId(10); u.setEmail("juan@email.com"); u.setPasswordHash("hash"); u.setEstadoRegistro("active");
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(encoder.matches("mala", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("juan@email.com", "mala")))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.INVALID_CREDENTIALS));
    }

    @Test
    void login_cuentaPendiente_devuelveSesionPendiente() {
        Usuario u = new Usuario();
        u.setId(10); u.setEmail("juan@email.com"); u.setPasswordHash("hash"); u.setEstadoRegistro("pending_verification");
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(encoder.matches("Password123!", "hash")).thenReturn(true);

        var res = authService.login(new LoginRequest("juan@email.com", "Password123!"));

        assertThat(res.usuario().estado()).isEqualTo("pending_verification");
    }

    // ------------------------ VERIFICACION DE EMAIL ----------------------

    @Test
    void verifyEmail_tokenInexistente_lanzaCodeInvalid() {
        when(pendingRepo.findByToken("tok-x")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("tok-x", "000000")))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.CODE_INVALID));
    }

    @Test
    void verifyEmail_codigoIncorrecto_lanzaCodeInvalid() {
        when(pendingRepo.findByToken("tok-7"))
                .thenReturn(Optional.of(pendiente("123456", LocalDateTime.now().plusMinutes(10))));

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("tok-7", "000000")))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.CODE_INVALID));
    }

    @Test
    void verifyEmail_codigoExpirado_lanzaCodeExpired() {
        when(pendingRepo.findByToken("tok-7"))
                .thenReturn(Optional.of(pendiente("123456", LocalDateTime.now().minusMinutes(1))));

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("tok-7", "123456")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo(ErrorCodes.CODE_EXPIRED);
                    assertThat(ex.getStatus().value()).isEqualTo(410);
                });
    }

    @Test
    void verifyEmail_codigoCorrecto_creaUsuarioYBorraPendiente() {
        RegistroPendiente pend = pendiente("123456", LocalDateTime.now().plusMinutes(10));
        when(pendingRepo.findByToken("tok-7")).thenReturn(Optional.of(pend));
        when(usuarioRepo.existsByEmail("juan@email.com")).thenReturn(false);
        when(personaRepo.existsByDocumento("30123456")).thenReturn(false);
        when(personaRepo.save(any())).thenAnswer(inv -> { Persona p = inv.getArgument(0); p.setIdentificador(5); return p; });
        Empleado emp = new Empleado(); emp.setIdentificador(1);
        when(empleadoRepo.findAll()).thenReturn(List.of(emp));
        when(usuarioRepo.save(any())).thenAnswer(inv -> { Usuario u = inv.getArgument(0); u.setId(10); return u; });

        var res = authService.verifyEmail(new VerifyEmailRequest("tok-7", "123456"));

        assertThat(res.mensaje()).contains("verificado correctamente");
        // se crearon las filas reales y se borro el pendiente (por email, incluye hermanos)
        verify(personaRepo).save(any());
        verify(clienteRepo).save(any());
        verify(usuarioRepo).save(any());
        verify(pendingRepo).deleteByEmail("juan@email.com");
    }

    // ----------------------- RECUPERACION DE CLAVE -----------------------

    @Test
    void forgotPassword_emailInexistente_respuestaGenericaSinToken() {
        when(usuarioRepo.findByEmail("nadie@email.com")).thenReturn(Optional.empty());

        var res = authService.forgotPassword(new ForgotPasswordRequest("nadie@email.com"));

        assertThat(res.message()).isNotBlank();
        assertThat(res.devCode()).isNull();
        verify(tokenRepo, never()).save(any());
    }

    @Test
    void forgotPassword_emailExistente_creaTokenReset() {
        Usuario u = new Usuario(); u.setId(10); u.setEmail("juan@email.com");
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(emailService.isDevMode()).thenReturn(true);

        var res = authService.forgotPassword(new ForgotPasswordRequest("juan@email.com"));

        assertThat(res.devCode()).matches("\\d{6}");
        verify(tokenRepo).deleteByUsuarioAndTipo(10, "reset");
        verify(tokenRepo).save(any());
    }

    @Test
    void resetPassword_passwordsNoCoinciden_lanzaMismatch() {
        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest("juan@email.com", "123456", "Password123!", "Otra123!")))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.PASSWORD_MISMATCH));
    }

    @Test
    void resetPassword_codigoInvalido_lanzaCodeInvalid() {
        Usuario u = new Usuario(); u.setId(10); u.setEmail("juan@email.com");
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(tokenRepo.findByValorAndTipo("10:000000", "reset")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest("juan@email.com", "000000", "Password123!", "Password123!")))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.CODE_INVALID));
    }

    @Test
    void resetPassword_ok_actualizaHash() {
        Usuario u = new Usuario(); u.setId(10); u.setEmail("juan@email.com"); u.setPasswordHash("viejo");
        Token t = new Token(); t.setUsuario(10); t.setValor("10:123456"); t.setTipo("reset");
        t.setUsado("no"); t.setExpira(LocalDateTime.now().plusMinutes(10));
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(tokenRepo.findByValorAndTipo("10:123456", "reset")).thenReturn(Optional.of(t));
        when(encoder.encode("Password123!")).thenReturn("nuevoHash");

        authService.resetPassword(new ResetPasswordRequest("juan@email.com", "123456", "Password123!", "Password123!"));

        assertThat(u.getPasswordHash()).isEqualTo("nuevoHash");
        assertThat(t.getUsado()).isEqualTo("si");
    }
}
