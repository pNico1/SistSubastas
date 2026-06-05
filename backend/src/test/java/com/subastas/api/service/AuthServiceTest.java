package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Empleado;
import com.subastas.api.domain.Persona;
import com.subastas.api.domain.Token;
import com.subastas.api.domain.Usuario;
import com.subastas.api.dto.LoginRequest;
import com.subastas.api.dto.RegisterRequest;
import com.subastas.api.dto.RegisterResponse;
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
import static org.mockito.Mockito.when;

/**
 * Tests de errores de LOGIN y REGISTRO sobre el codigo real de AuthService
 * (repositorios mockeados). Correr con: mvn test
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
    @Mock PasswordEncoder encoder;
    @Mock JwtService jwtService;
    @Mock EmailService emailService;

    @InjectMocks AuthService authService;

    private RegisterRequest registro() {
        return new RegisterRequest("Juan", "Perez", "30123456", "Calle 1",
                1, "juan@email.com", null, null);
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
    void register_ok_devuelveClaveProvisoriaYPendiente() {
        when(usuarioRepo.existsByEmail(any())).thenReturn(false);
        when(personaRepo.existsByDocumento(any())).thenReturn(false);
        when(paisRepo.existsById(1)).thenReturn(true);
        when(personaRepo.save(any())).thenAnswer(inv -> { Persona p = inv.getArgument(0); p.setIdentificador(5); return p; });
        when(usuarioRepo.save(any())).thenAnswer(inv -> { Usuario u = inv.getArgument(0); u.setId(10); return u; });
        Empleado emp = new Empleado(); emp.setIdentificador(1);
        when(empleadoRepo.findAll()).thenReturn(List.of(emp));
        when(encoder.encode(any())).thenReturn("hash");
        when(emailService.isDevMode()).thenReturn(true);
        when(tokenRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RegisterResponse res = authService.register(registro());

        assertThat(res.status()).isEqualTo("pending_verification");
        assertThat(res.provisionalPassword()).startsWith("BIDSTER-");
        assertThat(res.devCode()).isNotNull();                 // en modo dev se devuelve
        assertThat(res.devCode()).matches("\\d{6}");           // codigo de 6 digitos
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
    void verifyEmail_codigoInexistente_lanzaCodeInvalid() {
        Usuario u = new Usuario(); u.setId(10); u.setEmailVerificado("no");
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(tokenRepo.findByValorAndTipo("10:000000", "verification")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("juan@email.com", "000000")))
                .isInstanceOfSatisfying(ApiException.class, ex ->
                        assertThat(ex.getCode()).isEqualTo(ErrorCodes.CODE_INVALID));
    }

    @Test
    void verifyEmail_codigoExpirado_lanzaCodeExpired() {
        Usuario u = new Usuario(); u.setId(10); u.setEmailVerificado("no");
        Token t = new Token(); t.setUsuario(10); t.setValor("10:123456"); t.setTipo("verification");
        t.setUsado("no"); t.setExpira(LocalDateTime.now().minusMinutes(1));
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(tokenRepo.findByValorAndTipo("10:123456", "verification")).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("juan@email.com", "123456")))
                .isInstanceOfSatisfying(ApiException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo(ErrorCodes.CODE_EXPIRED);
                    assertThat(ex.getStatus().value()).isEqualTo(410);
                });
    }

    @Test
    void verifyEmail_codigoCorrecto_marcaVerificado() {
        Usuario u = new Usuario(); u.setId(10); u.setEmailVerificado("no");
        Token t = new Token(); t.setUsuario(10); t.setValor("10:123456"); t.setTipo("verification");
        t.setUsado("no"); t.setExpira(LocalDateTime.now().plusMinutes(10));
        when(usuarioRepo.findByEmail("juan@email.com")).thenReturn(Optional.of(u));
        when(tokenRepo.findByValorAndTipo("10:123456", "verification")).thenReturn(Optional.of(t));

        authService.verifyEmail(new VerifyEmailRequest("juan@email.com", "123456"));

        assertThat(u.getEmailVerificado()).isEqualTo("si");
        assertThat(t.getUsado()).isEqualTo("si");
    }
}
