package com.subastas.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

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

    /** true si no hay proveedor/API key: el codigo se loguea/devuelve en vez de mandarse por mail. */
    public boolean isDevMode() {
        return !hasApiKey() || (!isResend() && !isMailtrap());
    }

    public void enviarCodigoVerificacion(String toEmail, String nombre, String codigo) {
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
            log.warn("==================== EMAIL (MODO DEV) ====================");
            log.warn(" Para: {}  ->  CODIGO DE VERIFICACION: {}", toEmail, codigo);
            log.warn("=========================================================");
            return;
        }

        try {
            if (isMailtrap()) {
                enviarConMailtrap(toEmail, nombre, html);
            } else if (isResend()) {
                enviarConResend(toEmail, html);
            }
        } catch (Exception e) {
            // No rompemos el registro por un fallo de email: el codigo ya quedo guardado
            // y el usuario puede pedir reenvio.
            log.error("No se pudo enviar el email a {}: {}", toEmail, e.getMessage());
        }
    }

    private void enviarConResend(String toEmail, String html) {
        String recipient = recipient(toEmail);
        http.post()
                .uri(endpoint("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", sender(),
                        "to", List.of(recipient),
                        "subject", "Tu codigo de verificacion - Bidster",
                        "html", html))
                .retrieve()
                .toBodilessEntity();
        log.info("Email de verificacion enviado a {} via {}", recipient, provider);
    }

    private void enviarConMailtrap(String toEmail, String nombre, String html) {
        String recipient = recipient(toEmail);
        http.post()
                .uri(endpoint("https://send.api.mailtrap.io/api/send"))
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", Map.of("email", fromEmail, "name", fromName),
                        "to", List.of(Map.of("email", recipient, "name", nombre == null ? "" : nombre)),
                        "subject", "Tu codigo de verificacion - Bidster",
                        "html", html,
                        "category", "email_verification"))
                .retrieve()
                .toBodilessEntity();
        log.info("Email de verificacion enviado a {} via {}", recipient, provider);
    }

    private boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }

    private boolean isResend() {
        return "resend".equalsIgnoreCase(provider);
    }

    private boolean isMailtrap() {
        return "mailtrap".equalsIgnoreCase(provider);
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
