package com.subastas.api.dto;

/** Body de POST /api/clientes/me/fines/{id}/payment. */
public record PagoMultaRequest(
        Integer paymentMethodId
) {}
