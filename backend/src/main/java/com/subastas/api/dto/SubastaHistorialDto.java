package com.subastas.api.dto;

import java.time.LocalDate;

/** GET /api/clientes/me/subastas/historial — subasta en la que participo y resultado. */
public record SubastaHistorialDto(
        Integer subastaId,
        LocalDate fecha,
        String estado,
        String resultado   // ganada / perdida
) {}
