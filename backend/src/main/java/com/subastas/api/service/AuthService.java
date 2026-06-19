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
    private final RegistroPendienteRepository pendingRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(UsuarioRepository usuarioRepo, PersonaRepository personaRepo,
                       ClienteRepository clienteRepo, EmpleadoRepository empleadoRepo,
                       PaisRepository paisRepo, TokenRepository tokenRepo,
                       RegistroPendienteRepository pendingRepo,
                       PasswordEncoder encoder, JwtService jwtService, EmailService emailService) {
        this.usuarioRepo = usuarioRepo;
        this.personaRepo = personaRepo;
        this.clienteRepo = clienteRepo;
        this.empleadoRepo = empleadoRepo;
        this.paisRepo = paisRepo;
        this.tokenRepo = tokenRepo;
        this.pendingRepo = pendingRepo;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    /**
     * Etapa 1: el postor ingresa sus datos. NO se crea nada en personas/usuarios/
     * clientes todavia: los datos quedan en 'registrosPendientes' hasta que el
     * usuario verifique el codigo. Asi, si abandona el registro antes de verificar
     * (p.ej. cierra la app), no queda ninguna fila en las tablas reales y puede
     * volver a registrarse con el mismo email/documento.
     */
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

        // El usuario NO elige clave: se le genera una provisoria que vera en la
        // pantalla de exito y usara una vez aprobada la verificacion del empleado.
        String passwordProvisoria = generarPasswordProvisoria();
        String codigo = generarCodigo();

        // Cada registracion es una fila nueva e independiente, identificada por un
        // token opaco. La verificacion se atara a ESTE token (no al email), asi dos
        // registros con el mismo email no se pisan ni se mezclan los datos.
        String token = generarToken();
        RegistroPendiente pend = new RegistroPendiente();
        pend.setToken(token);
        pend.setEmail(req.email());
        pend.setDocumento(req.documento());
        pend.setNombre(req.nombre());
        pend.setApellido(req.apellido());
        pend.setDireccion(req.domicilio());
        pend.setPaisOrigen(req.paisOrigenId());
        pend.setFotoDocFrente(decodeFotoOrNull(req.fotoDocFrente()));   // opcional (puede subirla luego)
        pend.setFotoDocDorso(decodeFotoOrNull(req.fotoDocDorso()));
        pend.setPasswordHash(encoder.encode(passwordProvisoria));       // se guarda hasheada
        pend.setCodigo(codigo);                                         // efimero, 15 min
        pend.setExpira(LocalDateTime.now().plusMinutes(15));
        pend.setFechaCreacion(LocalDateTime.now());
        pend = pendingRepo.save(pend);

        emailService.enviarCodigoVerificacion(req.email(), req.nombre(), codigo);

        return new RegisterResponse(
                token,
                "pending_verification",
                "Te enviamos un codigo de verificacion a tu email.",
                passwordProvisoria,
                emailService.isDevMode() ? codigo : null   // en modo dev se devuelve para poder probar
        );
    }

    /**
     * Verifica el codigo que el usuario recibio por mail. RECIEN ACA se crean las
     * filas reales (persona + cliente + usuario) a partir del registro pendiente,
     * y se borra el pendiente.
     */
    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest req) {
        RegistroPendiente pend = pendingRepo.findByToken(req.registrationId())
                .orElseThrow(() -> ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido"));
        if (!pend.getCodigo().equals(req.codigo())) {
            throw ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido");
        }
        if (pend.getExpira().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.GONE, ErrorCodes.CODE_EXPIRED, "El codigo expiro, pedi uno nuevo");
        }

        // Re-chequeo de unicidad: alguien pudo haber tomado el email/documento
        // mientras este registro estaba pendiente.
        if (usuarioRepo.existsByEmail(pend.getEmail())) {
            throw ApiException.conflict(ErrorCodes.EMAIL_ALREADY_REGISTERED, "El email ya esta registrado");
        }
        if (personaRepo.existsByDocumento(pend.getDocumento())) {
            throw ApiException.conflict(ErrorCodes.DOCUMENT_ALREADY_REGISTERED, "El documento ya esta registrado");
        }

        Persona persona = new Persona();
        persona.setNombre(pend.getNombre());
        persona.setApellido(pend.getApellido());
        persona.setDocumento(pend.getDocumento());
        persona.setDireccion(pend.getDireccion());
        persona.setEstado("activo");
        persona.setFotoDocFrente(pend.getFotoDocFrente());
        persona.setFotoDocDorso(pend.getFotoDocDorso());
        persona = personaRepo.save(persona);

        // Cliente provisorio (la categoria/admision la define la verificacion del empleado).
        Integer verificador = empleadoRepo.findAll().stream()
                .findFirst().map(Empleado::getIdentificador)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        ErrorCodes.INTERNAL_ERROR, "No hay empleados para asignar como verificador"));
        Cliente cliente = new Cliente();
        cliente.setIdentificador(persona.getIdentificador());
        cliente.setNumeroPais(pend.getPaisOrigen());
        cliente.setAdmitido("no");
        cliente.setCategoria("comun");
        cliente.setVerificador(verificador);
        clienteRepo.save(cliente);

        Usuario usuario = new Usuario();
        usuario.setPersona(persona.getIdentificador());
        usuario.setEmail(pend.getEmail());
        usuario.setPasswordHash(pend.getPasswordHash());   // hash ya calculado en register()
        usuario.setEstadoRegistro("pending_verification"); // el admin lo aprueba despues
        usuario.setEmailVerificado("si");
        usuario.setFechaCreacion(LocalDateTime.now());
        usuarioRepo.save(usuario);

        // borra este pendiente y cualquier hermano del mismo email (ya no verificables)
        pendingRepo.deleteByEmail(pend.getEmail());
        return MessageResponse.of("Email verificado correctamente");
    }

    /** Reenvia un nuevo codigo de verificacion. Respuesta generica (no revela si el email existe). */
    @Transactional
    public MessageResponse resendCode(ResendCodeRequest req) {
        pendingRepo.findByToken(req.registrationId()).ifPresent(pend -> {
            String codigo = generarCodigo();
            pend.setCodigo(codigo);
            pend.setExpira(LocalDateTime.now().plusMinutes(15));
            pendingRepo.save(pend);
            emailService.enviarCodigoVerificacion(pend.getEmail(), pend.getNombre(), codigo);
        });
        return MessageResponse.of("Si el registro sigue activo, te enviamos un nuevo codigo.");
    }

    // ---- helpers de tokens ----

    /** El valor del token combina el id de usuario con el codigo para garantizar unicidad. */
    private String valorToken(Integer usuarioId, String codigo) {
        return usuarioId + ":" + codigo;
    }

    private String generarCodigo() {
        java.security.SecureRandom r = new java.security.SecureRandom();
        return String.format("%06d", r.nextInt(1_000_000)); // 000000..999999
    }

    /** Token opaco que identifica una registracion pendiente (el registrationId). */
    private String generarToken() {
        byte[] bytes = new byte[24];
        new java.security.SecureRandom().nextBytes(bytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
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

    /**
     * Inicia la recuperacion de contrasenia: si existe un usuario con ese email,
     * genera un codigo (token tipo 'reset', 15 min) y lo manda por mail. La
     * respuesta es generica para no revelar si el email existe (anti-enumeracion).
     */
    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest req) {
        String[] devCode = { null };
        usuarioRepo.findByEmail(req.email()).ifPresent(u -> {
            tokenRepo.deleteByUsuarioAndTipo(u.getId(), "reset"); // invalida codigos previos
            String codigo = generarCodigo();
            Token token = new Token();
            token.setUsuario(u.getId());
            token.setValor(valorToken(u.getId(), codigo));
            token.setTipo("reset");
            token.setExpira(LocalDateTime.now().plusMinutes(15));
            token.setUsado("no");
            tokenRepo.save(token);
            emailService.enviarCodigoReset(u.getEmail(), codigo);
            if (emailService.isDevMode()) devCode[0] = codigo;
        });
        return new ForgotPasswordResponse(
                "Si el email esta registrado, te enviamos un codigo para restablecer la contrasenia.",
                devCode[0]);
    }

    /** Completa la recuperacion: valida el codigo y setea la nueva contrasenia. */
    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest req) {
        if (!req.password().equals(req.passwordConfirmation())) {
            throw ApiException.unprocessable(ErrorCodes.PASSWORD_MISMATCH, "Las contrasenias no coinciden");
        }
        if (!isStrong(req.password())) {
            throw ApiException.unprocessable(ErrorCodes.WEAK_PASSWORD,
                    "La contrasenia debe tener al menos 8 caracteres, una letra y un numero");
        }

        // Respuesta generica si el email no existe (mismo codigo que codigo invalido).
        Usuario usuario = usuarioRepo.findByEmail(req.email())
                .orElseThrow(() -> ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido"));

        Token token = tokenRepo.findByValorAndTipo(valorToken(usuario.getId(), req.codigo()), "reset")
                .orElseThrow(() -> ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido"));
        if ("si".equals(token.getUsado())) {
            throw ApiException.unprocessable(ErrorCodes.CODE_INVALID, "Codigo invalido");
        }
        if (token.getExpira().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.GONE, ErrorCodes.CODE_EXPIRED, "El codigo expiro, pedi uno nuevo");
        }

        token.setUsado("si");
        tokenRepo.save(token);
        usuario.setPasswordHash(encoder.encode(req.password()));
        usuarioRepo.save(usuario);
        return MessageResponse.of("Contrasenia actualizada. Ya podes iniciar sesion.");
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
