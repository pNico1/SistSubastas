package com.subastas.api.dto;

public record RegisterResponse(
        String registrationId,
        String status,
        String message,
        // Clave provisoria autogenerada. El usuario la usara para ingresar una vez
        // que la empresa apruebe la verificacion de su cuenta.
        String provisionalPassword,
        // Solo en modo dev (sin SMTP configurado): el codigo de verificacion de
        // email, para poder probar el flujo sin recibir el mail. En produccion es null.
        String devCode
) {}
