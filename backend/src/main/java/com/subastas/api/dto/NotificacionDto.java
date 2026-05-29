package com.subastas.api.dto;

import java.time.LocalDateTime;

public record NotificacionDto(
        Integer id,
        String tipo,
        String mensaje,
        boolean leido,
        LocalDateTime fecha
) {}
