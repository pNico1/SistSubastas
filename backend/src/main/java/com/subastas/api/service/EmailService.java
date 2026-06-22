package com.subastas.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Envia emails transaccionales.
 * Si no hay proveedor/API key configurados, funciona en MODO DEV: loguea el
 * codigo en consola en vez de mandar mail (asi se puede probar sin configurar nada).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final RestClient http = RestClient.create();

    @Value("${app.email.provider:dev}")
    private String provider;
    @Value("${app.email.api-key:}")
    private String apiKey;
    @Value("${app.email.api-url:}")
    private String apiUrl;
    @Value("${app.email.from-email:mailtrap@demomailtrap.co}")
    private String fromEmail;
    @Value("${app.email.from-name:Bidster}")
    private String fromName;
    @Value("${app.email.test-to-email:}")
    private String testToEmail;
    @Value("${app.email.gmail-client-id:}")
    private String gmailClientId;
    @Value("${app.email.gmail-client-secret:}")
    private String gmailClientSecret;
    @Value("${app.email.gmail-refresh-token:}")
    private String gmailRefreshToken;

    /** true si no hay proveedor/API key: el codigo se loguea/devuelve en vez de mandarse por mail. */
    public boolean isDevMode() {
        if (isGmail()) {
            return !hasGmailCredentials();
        }
        return !hasApiKey() || (!isResend() && !isMailtrap());
    }

    public void enviarCodigoVerificacion(String toEmail, String nombre, String codigo) {
        // El codigo SIEMPRE se loguea en consola (util para desarrollo/demo), se mande o no el email real.
        log.warn("==================== CODIGO DE VERIFICACION ====================");
        log.warn(" Para: {}  ->  CODIGO: {}", toEmail, codigo);
        log.warn("===============================================================");

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
                  <h2 style="color:#0B64ED">Bidster</h2>
                  <p>Hola %s,</p>
                  <p>Tu codigo de verificacion es:</p>
                  <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#2B2A51">%s</p>
                  <p style="color:#8B88A8">El codigo vence en 15 minutos. Si no creaste esta cuenta, ignora este mail.</p>
                </div>
                """.formatted(nombre == null ? "" : nombre, codigo);

        if (isDevMode()) {
            // Modo dev: no se manda email real; el codigo ya quedo logueado arriba.
            return;
        }

        try {
            if (isMailtrap()) {
                enviarConMailtrap(toEmail, nombre, "Tu codigo de verificacion - Bidster", html, "email_verification");
            } else if (isResend()) {
                enviarConResend(toEmail, "Tu codigo de verificacion - Bidster", html);
            } else if (isGmail()) {
                enviarConGmail(toEmail, "Tu codigo de verificacion - Bidster", html);
            }
        } catch (Exception e) {
            // No rompemos el registro por un fallo de email: el codigo ya quedo guardado
            // y el usuario puede pedir reenvio.
            log.error("No se pudo enviar el email a {}: {}", toEmail, e.getMessage());
        }
    }

    public void enviarCodigoReset(String toEmail, String codigo) {
        // El codigo SIEMPRE se loguea en consola (util para desarrollo/demo), se mande o no el email real.
        log.warn("==================== CODIGO DE RECUPERACION ====================");
        log.warn(" Para: {}  ->  CODIGO RESET: {}", toEmail, codigo);
        log.warn("===============================================================");

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
                  <h2 style="color:#0B64ED">Bidster</h2>
                  <p>Recibimos un pedido para restablecer tu contrasenia.</p>
                  <p>Tu codigo es:</p>
                  <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#2B2A51">%s</p>
                  <p style="color:#8B88A8">El codigo vence en 15 minutos. Si no pediste esto, ignora este mail.</p>
                </div>
                """.formatted(codigo);

        if (isDevMode()) {
            // Modo dev: no se manda email real; el codigo ya quedo logueado arriba.
            return;
        }

        try {
            if (isMailtrap()) {
                enviarConMailtrap(toEmail, null, "Restablece tu contrasenia - Bidster", html, "password_reset");
            } else if (isResend()) {
                enviarConResend(toEmail, "Restablece tu contrasenia - Bidster", html);
            } else if (isGmail()) {
                enviarConGmail(toEmail, "Restablece tu contrasenia - Bidster", html);
            }
        } catch (Exception e) {
            log.error("No se pudo enviar el email de reset a {}: {}", toEmail, e.getMessage());
        }
    }

    public void enviarCuentaVerificada(String toEmail, String nombre, String categoria) {
        String categoriaTexto = categoria == null || categoria.isBlank() ? "asignada" : categoria;
        String html = """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
                  <h2 style="color:#0B64ED">Bidster</h2>
                  <p>Hola %s,</p>
                  <p>Tu identidad fue verificada correctamente.</p>
                  <p>Tu categoria inicial es: <strong style="color:#2B2A51">%s</strong>.</p>
                  <p style="color:#8B88A8">La proxima vez que abras Bidster vas a poder crear tu contrasenia personal y cargar un metodo de pago.</p>
                </div>
                """.formatted(nombre == null ? "" : nombre, categoriaTexto);
        log.warn("==================== EMAIL (MODO DEV) ====================");
        log.warn(" Para: {}  ->  CUENTA VERIFICADA. CATEGORIA: {}", toEmail, categoriaTexto);
        log.warn("=========================================================");

        if (isDevMode()) {
            // Modo dev: no se manda email real; el codigo ya quedo logueado arriba.
            return;
        }

        try {
            if (isMailtrap()) {
                enviarConMailtrap(toEmail, nombre, "Tu cuenta fue verificada - Bidster", html, "account_verified");
            } else if (isResend()) {
                enviarConResend(toEmail, "Tu cuenta fue verificada - Bidster", html);
            } else if (isGmail()) {
                enviarConGmail(toEmail, "Tu cuenta fue verificada - Bidster", html);
            }
        } catch (Exception e) {
            log.error("No se pudo enviar el email de cuenta verificada a {}: {}", toEmail, e.getMessage());
        }
    }

    private void enviarConResend(String toEmail, String subject, String html) {
        String recipient = recipient(toEmail);
        http.post()
                .uri(endpoint("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", sender(),
                        "to", List.of(recipient),
                        "subject", subject,
                        "html", html))
                .retrieve()
                .toBodilessEntity();
        log.info("Email transaccional '{}' enviado a {} via {}", subject, recipient, provider);
    }

    private void enviarConGmail(String toEmail, String subject, String html) {
        String recipient = recipient(toEmail);
        String accessToken = obtenerAccessTokenGmail();
        http.post()
                .uri(endpoint("https://gmail.googleapis.com/gmail/v1/users/me/messages/send"))
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("raw", gmailRawMessage(recipient, subject, html)))
                .retrieve()
                .toBodilessEntity();
        log.info("Email transaccional '{}' enviado a {} via Gmail API", subject, recipient);
    }

    private void enviarConMailtrap(String toEmail, String nombre, String subject, String html, String category) {
        String recipient = recipient(toEmail);
        http.post()
                .uri(endpoint("https://send.api.mailtrap.io/api/send"))
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", Map.of("email", fromEmail, "name", fromName),
                        "to", List.of(Map.of("email", recipient, "name", nombre == null ? "" : nombre)),
                        "subject", subject,
                        "html", html,
                        "category", category))
                .retrieve()
                .toBodilessEntity();
        log.info("Email transaccional '{}' enviado a {} via {}", subject, recipient, provider);
    }

    @SuppressWarnings("unchecked")
    private String obtenerAccessTokenGmail() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", gmailClientId);
        form.add("client_secret", gmailClientSecret);
        form.add("refresh_token", gmailRefreshToken);
        form.add("grant_type", "refresh_token");

        Map<String, Object> response = http.post()
                .uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        Object accessToken = response == null ? null : response.get("access_token");
        if (accessToken == null || accessToken.toString().isBlank()) {
            throw new IllegalStateException("Google no devolvio access_token para Gmail");
        }
        return accessToken.toString();
    }

    private String gmailRawMessage(String toEmail, String subject, String html) {
        String bodyBase64 = Base64.getMimeEncoder(76, "\r\n".getBytes(StandardCharsets.US_ASCII))
                .encodeToString(html.getBytes(StandardCharsets.UTF_8));
        String mime = "From: " + sender() + "\r\n"
                + "To: " + toEmail + "\r\n"
                + "Subject: " + subject + "\r\n"
                + "MIME-Version: 1.0\r\n"
                + "Content-Type: text/html; charset=UTF-8\r\n"
                + "Content-Transfer-Encoding: base64\r\n"
                + "\r\n"
                + bodyBase64;
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(mime.getBytes(StandardCharsets.UTF_8));
    }

    private boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    private boolean hasGmailCredentials() {
        return gmailClientId != null && !gmailClientId.isBlank()
                && gmailClientSecret != null && !gmailClientSecret.isBlank()
                && gmailRefreshToken != null && !gmailRefreshToken.isBlank()
                && fromEmail != null && !fromEmail.isBlank();
    }

    private boolean isResend() {
        return "resend".equalsIgnoreCase(provider);
    }

    private boolean isMailtrap() {
        return "mailtrap".equalsIgnoreCase(provider);
    }

    private boolean isGmail() {
        return "gmail".equalsIgnoreCase(provider);
    }

    private String endpoint(String defaultUrl) {
        return apiUrl == null || apiUrl.isBlank() ? defaultUrl : apiUrl;
    }

    private String recipient(String toEmail) {
        return testToEmail == null || testToEmail.isBlank() ? toEmail : testToEmail;
    }

    private String sender() {
        if (fromName == null || fromName.isBlank()) {
            return fromEmail;
        }
        return "%s <%s>".formatted(fromName, fromEmail);
    }
}
