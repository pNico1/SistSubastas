package com.subastas.api.dto;

import java.time.LocalDate;

/** GET /api/clientes/me/adquisiciones/{id}/entrega/envio */
public record ShippingStatusDto(
        String estado,
        LocalDate fechaEstimada
) {}
