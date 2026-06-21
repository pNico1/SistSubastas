package com.subastas.api.dto;

import java.time.LocalDate;

/** GET /api/clientes/me/adquisiciones/{id}/entrega */
public record EntregaDto(
        Integer id,
        String tipo,
        String estado,
        String direccion,
        LocalDate fechaDisponible
) {}
