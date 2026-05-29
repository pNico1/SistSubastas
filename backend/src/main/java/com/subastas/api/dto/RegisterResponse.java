package com.subastas.api.dto;

public record RegisterResponse(
        String registrationId,
        String status,
        String message,
        // En produccion el token se envia por mail. Se devuelve aca para poder
        // probar la etapa 2 en desarrollo.
        String token
) {}
