package com.subastas.api.dto;

/** Body de POST /api/clientes/me/adquisiciones/{id}/entrega/envio */
public record SeleccionEnvioRequest(
        String direccion
) {}
