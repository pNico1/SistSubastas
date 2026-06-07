package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.common.dto.MessageResponse;
import com.subastas.api.domain.*;
import com.subastas.api.dto.*;
import com.subastas.api.repository.*;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import com.subastas.api.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    private final EmailService emailService;

    public AuthService(UsuarioRepository usuarioRepo, PersonaRepository personaRepo,
                       ClienteRepository clienteRepo, EmpleadoRepository empleadoRepo,
                       PaisRepository paisRepo, TokenRepository tokenRepo,
                       PasswordEncoder encoder, JwtService jwtService, EmailService emailService) {
        this.usuarioRepo = usuarioRepo;
        this.personaRepo = personaRepo;
        this.clienteRepo = clienteRepo;
        this.empleadoRepo = empleadoRepo;
        this.paisRepo = paisRepo;
        this.tokenRepo = tokenRepo;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
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
        persona.setFotoDocFrente(decodeFotoOrNull(req.fotoDocFrente()));   // opcional (puede subirla luego)
        persona.setFotoDocDorso(decodeFotoOrNull(req.fotoDocDorso()));
        persona = personaRepo.save(persona);

        // El usuario NO elige clave: se le genera una provisoria que usara una vez
        // aprobada la verificacion. La cuenta queda pendiente.
        String passwordProvisoria = generarPasswordProvisoria();
        Usuario usuario = new Usuario();
        usuario.setPersona(persona.getIdentificador());
        usuario.setEmail(req.email());
        usuario.setPasswordHash(encoder.encode(passwordProvisoria));
        usuario.setEstadoRegistro("pending_verification");
        usuario.setEmailVerificado("no");
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

        // Genera y envia el codigo de verificacion de email.
        String codigo = emitirCodigoVerificacion(usuario, persona.getNombre());

        return new RegisterResponse(
                String.valueOf(usuario.getId()),
                "pending_verification",
                "Te enviamos un codigo de verificacion a tu email.",
                passwordProvisoria,
                emailService.isDevMode() ? codigo : null   // en modo dev se devuelve para poder probar
        );
    }

    /** Verifica el codigo que el usuario recibio por mail. */
    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest req) {
        Usuario usuario = usuarioRepo.findByEmail(req.email())
                .orElseThrow(() -> ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido"));

        if ("si".equals(usuario.getEmailVerificado())) {
            return MessageResponse.of("El email ya estaba verificado");
        }

        Token token = tokenRepo.findByValorAndTipo(claveToken(usuario, req.codigo()), "verification")
                .orElseThrow(() -> ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido"));
        if ("si".equals(token.getUsado())) {
            throw ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido");
        }
        if (token.getExpira().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.GONE, ErrorCodes.CODE_EXPIRED, "El codigo expiro, pedi uno nuevo");
        }

        token.setUsado("si");
        tokenRepo.save(token);
        usuario.setEmailVerificado("si");
        usuarioRepo.save(usuario);
        return MessageResponse.of("Email verificado correctamente");
    }

    /** Reenvia un nuevo codigo de verificacion. Respuesta generica (no revela si el email existe). */
    @Transactional
    public MessageResponse resendCode(ResendCodeRequest req) {
        usuarioRepo.findByEmail(req.email()).ifPresent(u -> {
            if (!"si".equals(u.getEmailVerificado())) {
                emitirCodigoVerificacion(u, null);
            }
        });
        return MessageResponse.of("Si el email esta registrado, te enviamos un nuevo codigo.");
    }

    // ---- helpers de verificacion de email ----

    /** Crea/renueva el codigo de verificacion del usuario y lo envia por mail. Devuelve el codigo. */
    private String emitirCodigoVerificacion(Usuario usuario, String nombre) {
        tokenRepo.deleteByUsuarioAndTipo(usuario.getId(), "verification"); // invalida codigos previos
        String codigo = generarCodigo();
        Token token = new Token();
        token.setUsuario(usuario.getId());
        token.setValor(claveToken(usuario, codigo));
        token.setTipo("verification");
        token.setExpira(LocalDateTime.now().plusMinutes(15));
        token.setUsado("no");
        tokenRepo.save(token);
        emailService.enviarCodigoVerificacion(usuario.getEmail(), nombre, codigo);
        return codigo;
    }

    /** El valor del token combina el id de usuario con el codigo para garantizar unicidad. */
    private String claveToken(Usuario usuario, String codigo) {
        return usuario.getId() + ":" + codigo;
    }

    private String generarCodigo() {
        java.security.SecureRandom r = new java.security.SecureRandom();
        return String.format("%06d", r.nextInt(1_000_000)); // 000000..999999
    }

    /** Genera una clave provisoria legible tipo BIDSTER-XK4P. */
    private String generarPasswordProvisoria() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos
        java.security.SecureRandom r = new java.security.SecureRandom();
        StringBuilder sb = new StringBuilder("BIDSTER-");
        for (int i = 0; i < 4; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
        return sb.toString();
    }

    /** Decodifica una foto de documento en base64 (o data URI); null si viene vacia/invalida. */
    private byte[] decodeFotoOrNull(String base64) {
        if (base64 == null || base64.isBlank()) return null;
        try {
            String clean = base64.replaceFirst("^data:[^;]*;base64,", "").trim();
            byte[] bytes = java.util.Base64.getMimeDecoder().decode(clean);
            return bytes.length == 0 ? null : bytes;
        } catch (IllegalArgumentException e) {
            return null; // la foto es opcional: si no es valida, se ignora
        }
    }

    /** Etapa final: el usuario autenticado cambia la clave provisoria por una propia. */
    @Transactional
    public AuthTokensResponse completeRegistration(CompleteRegistrationRequest req) {
        AuthPrincipal principal = CurrentUser.get();
        Usuario usuario = usuarioRepo.findById(principal.usuarioId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        ErrorCodes.UNAUTHORIZED, "No autenticado"));
        usuario = syncRegistrationStatus(usuario);

        if ("pending_verification".equals(usuario.getEstadoRegistro())) {
            throw ApiException.forbidden(ErrorCodes.ACCOUNT_PENDING_VERIFICATION,
                    "Tu cuenta todavia esta pendiente de verificacion");
        }
        if ("active".equals(usuario.getEstadoRegistro())) {
            throw ApiException.conflict(ErrorCodes.ALREADY_COMPLETED,
                    "El registro ya fue completado");
        }
        if (!"registration_incomplete".equals(usuario.getEstadoRegistro())
                && !"approved".equals(usuario.getEstadoRegistro())) {
            throw ApiException.forbidden(ErrorCodes.ACCOUNT_REGISTRATION_INCOMPLETE,
                    "No podes completar la contrasenia en el estado actual de la cuenta");
        }
        if (!req.password().equals(req.passwordConfirmation())) {
            throw ApiException.unprocessable(ErrorCodes.PASSWORD_MISMATCH, "Las contrasenias no coinciden");
        }
        if (!isStrong(req.password())) {
            throw ApiException.unprocessable(ErrorCodes.WEAK_PASSWORD,
                    "La contrasenia debe tener al menos 8 caracteres, una letra y un numero");
        }

        usuario.setPasswordHash(encoder.encode(req.password()));
        usuario.setEstadoRegistro("active");
        usuarioRepo.save(usuario);

        return buildTokens(usuario);
    }

    @Transactional
    public UsuarioDto currentUser() {
        AuthPrincipal principal = CurrentUser.get();
        Usuario usuario = usuarioRepo.findById(principal.usuarioId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        ErrorCodes.UNAUTHORIZED, "No autenticado"));
        usuario = syncRegistrationStatus(usuario);
        return toDto(usuario);
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

        usuario = syncRegistrationStatus(usuario);
        if ("suspended".equals(usuario.getEstadoRegistro())) {
            throw ApiException.forbidden(ErrorCodes.ACCOUNT_SUSPENDED, "Tu cuenta fue suspendida");
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
        usuario = syncRegistrationStatus(usuario);
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

        return new AuthTokensResponse(access, refresh, toDto(usuario));
    }

    private UsuarioDto toDto(Usuario usuario) {
        Integer clienteId = usuario.getPersona();
        String categoria = clienteId == null
                ? null
                : clienteRepo.findById(clienteId).map(Cliente::getCategoria).orElse(null);
        return new UsuarioDto(usuario.getId(), usuario.getEmail(), categoria, usuario.getEstadoRegistro());
    }

    /**
     * El admin aprueba clientes marcando clientes.admitido = 'si'. Como clientes
     * es una tabla del enunciado, no agregamos columnas ahi: sincronizamos el
     * estado propio de auth en usuarios.
     */
    private Usuario syncRegistrationStatus(Usuario usuario) {
        String estadoOriginal = usuario.getEstadoRegistro();
        String estado = normalize(estadoOriginal);
        if (estadoOriginal != null && !estadoOriginal.equals(estado)) {
            usuario.setEstadoRegistro(estado);
            usuario = usuarioRepo.save(usuario);
        }
        if (usuario.getPersona() == null) {
            return usuario;
        }

        boolean aprobadoPorAdmin = clienteRepo.findById(usuario.getPersona())
                .map(c -> isYes(c.getAdmitido()))
                .orElse(false);

        if (aprobadoPorAdmin
                && ("pending_verification".equals(estado)
                || "approved".equals(estado)
                || estado == null
                || estado.isBlank())) {
            usuario.setEstadoRegistro("registration_incomplete");
            return usuarioRepo.save(usuario);
        }
        return usuario;
    }

    private AuthPrincipal buildPrincipal(Usuario usuario) {
        Integer personaId = usuario.getPersona();
        List<String> roles = new ArrayList<>();
        Integer clienteId = null;
        if (personaId != null && clienteRepo.existsById(personaId)) {
            roles.add("ROLE_CLIENTE");
            clienteId = personaId;
        }
        if (personaId != null && empleadoRepo.existsById(personaId)) {
            roles.add("ROLE_EMPLEADO");
        }
        return new AuthPrincipal(usuario.getId(), personaId, usuario.getEmail(), clienteId, roles);
    }

    private boolean isStrong(String pwd) {
        return pwd != null && pwd.length() >= 8
                && pwd.chars().anyMatch(Character::isLetter)
                && pwd.chars().anyMatch(Character::isDigit);
    }

    private boolean isYes(String value) {
        return value != null && "si".equalsIgnoreCase(value.trim());
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
