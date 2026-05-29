package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.*;
import com.subastas.api.dto.*;
import com.subastas.api.repository.*;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepo;
    private final PersonaRepository personaRepo;
    private final ClienteRepository clienteRepo;
    private final EmpleadoRepository empleadoRepo;
    private final PaisRepository paisRepo;
    private final TokenRepository tokenRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepo, PersonaRepository personaRepo,
                       ClienteRepository clienteRepo, EmpleadoRepository empleadoRepo,
                       PaisRepository paisRepo, TokenRepository tokenRepo,
                       PasswordEncoder encoder, JwtService jwtService) {
        this.usuarioRepo = usuarioRepo;
        this.personaRepo = personaRepo;
        this.clienteRepo = clienteRepo;
        this.empleadoRepo = empleadoRepo;
        this.paisRepo = paisRepo;
        this.tokenRepo = tokenRepo;
        this.encoder = encoder;
        this.jwtService = jwtService;
    }

    /** Etapa 1: el postor ingresa sus datos. Queda pendiente de verificacion. */
    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        if (usuarioRepo.existsByEmail(req.email())) {
            throw ApiException.conflict(ErrorCodes.EMAIL_ALREADY_REGISTERED, "El email ya esta registrado");
        }
        if (personaRepo.existsByDocumento(req.documento())) {
            throw ApiException.conflict(ErrorCodes.DOCUMENT_ALREADY_REGISTERED, "El documento ya esta registrado");
        }
        if (!paisRepo.existsById(req.paisOrigenId())) {
            throw ApiException.unprocessable(ErrorCodes.INVALID_COUNTRY, "El pais de origen no existe");
        }

        Persona persona = new Persona();
        persona.setNombre(req.nombre());
        persona.setApellido(req.apellido());
        persona.setDocumento(req.documento());
        persona.setDireccion(req.domicilio());
        persona.setEstado("activo");
        persona = personaRepo.save(persona);

        Usuario usuario = new Usuario();
        usuario.setPersona(persona.getIdentificador());
        usuario.setEmail(req.email());
        usuario.setEstadoRegistro("pending_verification");
        usuario.setFechaCreacion(LocalDateTime.now());
        usuario = usuarioRepo.save(usuario);

        // Cliente provisorio (la categoria/admision la define la verificacion del empleado).
        Integer verificador = empleadoRepo.findAll().stream()
                .findFirst().map(Empleado::getIdentificador)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        ErrorCodes.INTERNAL_ERROR, "No hay empleados para asignar como verificador"));
        Cliente cliente = new Cliente();
        cliente.setIdentificador(persona.getIdentificador());
        cliente.setNumeroPais(req.paisOrigenId());
        cliente.setAdmitido("no");
        cliente.setCategoria("comun");
        cliente.setVerificador(verificador);
        clienteRepo.save(cliente);

        String tokenValor = UUID.randomUUID().toString();
        Token token = new Token();
        token.setUsuario(usuario.getId());
        token.setValor(tokenValor);
        token.setTipo("verification");
        token.setExpira(LocalDateTime.now().plusDays(1));
        token.setUsado("no");
        tokenRepo.save(token);

        return new RegisterResponse(
                String.valueOf(usuario.getId()),
                "pending_verification",
                "Tu solicitud esta en proceso de verificacion",
                tokenValor // en produccion se enviaria por mail
        );
    }

    /** Etapa 2: el usuario completa el registro y genera su clave. */
    @Transactional
    public AuthTokensResponse completeRegistration(CompleteRegistrationRequest req) {
        Token token = tokenRepo.findByValorAndTipo(req.token(), "verification")
                .orElseThrow(() -> ApiException.badRequest(ErrorCodes.TOKEN_INVALID, "Token invalido"));
        if ("si".equals(token.getUsado())) {
            throw ApiException.conflict(ErrorCodes.ALREADY_COMPLETED, "El registro ya fue completado");
        }
        if (token.getExpira().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.GONE, ErrorCodes.TOKEN_EXPIRED, "El token expiro");
        }
        if (!req.password().equals(req.passwordConfirmation())) {
            throw ApiException.unprocessable(ErrorCodes.PASSWORD_MISMATCH, "Las contrasenias no coinciden");
        }
        if (!isStrong(req.password())) {
            throw ApiException.unprocessable(ErrorCodes.WEAK_PASSWORD,
                    "La contrasenia debe tener al menos 8 caracteres, una letra y un numero");
        }

        Usuario usuario = usuarioRepo.findById(token.getUsuario())
                .orElseThrow(() -> ApiException.badRequest(ErrorCodes.TOKEN_INVALID, "Token invalido"));
        if (usuario.getPasswordHash() != null) {
            throw ApiException.conflict(ErrorCodes.ALREADY_COMPLETED, "El usuario ya tiene clave");
        }

        usuario.setPasswordHash(encoder.encode(req.password()));
        usuario.setEstadoRegistro("active");
        usuarioRepo.save(usuario);

        // marcar al cliente como admitido (verificacion superada)
        clienteRepo.findById(usuario.getPersona()).ifPresent(c -> {
            c.setAdmitido("si");
            clienteRepo.save(c);
        });

        token.setUsado("si");
        tokenRepo.save(token);

        return buildTokens(usuario);
    }

    public AuthTokensResponse login(LoginRequest req) {
        Usuario usuario = usuarioRepo.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        ErrorCodes.INVALID_CREDENTIALS, "Email o contrasenia incorrectos"));

        if (usuario.getPasswordHash() == null
                || !encoder.matches(req.password(), usuario.getPasswordHash())) {
            // mismo codigo para "no existe" y "password incorrecta" (evita enumeracion)
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    ErrorCodes.INVALID_CREDENTIALS, "Email o contrasenia incorrectos");
        }

        switch (usuario.getEstadoRegistro()) {
            case "pending_verification" -> throw ApiException.forbidden(
                    ErrorCodes.ACCOUNT_PENDING_VERIFICATION, "Tu cuenta esta pendiente de verificacion");
            case "approved", "registration_incomplete" -> throw ApiException.forbidden(
                    ErrorCodes.ACCOUNT_REGISTRATION_INCOMPLETE, "Debes completar tu registro");
            case "suspended" -> throw ApiException.forbidden(
                    ErrorCodes.ACCOUNT_SUSPENDED, "Tu cuenta fue suspendida");
            default -> { /* active: continua */ }
        }

        return buildTokens(usuario);
    }

    public AuthTokensResponse refresh(String refreshToken) {
        Claims claims;
        try {
            claims = jwtService.parse(refreshToken);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCodes.REFRESH_TOKEN_INVALID, "Refresh token invalido");
        }
        if (!jwtService.isRefreshToken(claims)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ErrorCodes.REFRESH_TOKEN_INVALID, "Refresh token invalido");
        }
        Integer uid = claims.get("uid", Integer.class);
        Usuario usuario = usuarioRepo.findById(uid)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        ErrorCodes.REFRESH_TOKEN_INVALID, "Refresh token invalido"));
        return buildTokens(usuario);
    }

    public void logout(String refreshToken) {
        tokenRepo.findByValorAndTipo(refreshToken, "refresh").ifPresent(t -> {
            t.setUsado("si");
            tokenRepo.save(t);
        });
    }

    // ---- helpers ----

    private AuthTokensResponse buildTokens(Usuario usuario) {
        AuthPrincipal principal = buildPrincipal(usuario);
        String access = jwtService.generateAccessToken(principal);
        String refresh = jwtService.generateRefreshToken(principal);

        String categoria = principal.clienteId() == null ? null
                : clienteRepo.findById(principal.clienteId()).map(Cliente::getCategoria).orElse(null);

        return new AuthTokensResponse(access, refresh,
                new UsuarioDto(usuario.getId(), categoria, usuario.getEstadoRegistro()));
    }

    private AuthPrincipal buildPrincipal(Usuario usuario) {
        Integer personaId = usuario.getPersona();
        List<String> roles = new ArrayList<>();
        Integer clienteId = null;
        if (clienteRepo.existsById(personaId)) {
            roles.add("ROLE_CLIENTE");
            clienteId = personaId;
        }
        if (empleadoRepo.existsById(personaId)) {
            roles.add("ROLE_EMPLEADO");
        }
        return new AuthPrincipal(usuario.getId(), personaId, usuario.getEmail(), clienteId, roles);
    }

    private boolean isStrong(String pwd) {
        return pwd != null && pwd.length() >= 8
                && pwd.chars().anyMatch(Character::isLetter)
                && pwd.chars().anyMatch(Character::isDigit);
    }
}
