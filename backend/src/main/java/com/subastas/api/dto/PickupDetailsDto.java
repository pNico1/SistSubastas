package com.subastas.api.dto;

/** GET /api/clientes/me/adquisiciones/{id}/entrega/retiro */
public record PickupDetailsDto(
        String direccion,
        String horario,
        String codigo
) {}
