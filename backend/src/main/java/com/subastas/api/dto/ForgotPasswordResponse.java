package com.subastas.api.dto;

public record ForgotPasswordResponse(
        String message,
        // Solo en modo dev (sin SMTP configurado): el codigo de reset, para poder
        // probar el flujo sin recibir el mail. En produccion es null.
        String devCode
) {}
