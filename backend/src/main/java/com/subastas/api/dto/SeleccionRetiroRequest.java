package com.subastas.api.dto;

/** Body de POST /api/clientes/me/adquisiciones/{id}/entrega/retiro */
public record SeleccionRetiroRequest(
        Boolean confirmar
) {}
