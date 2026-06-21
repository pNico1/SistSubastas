package com.subastas.api.dto;

/**
 * Body de POST /api/clientes/me/adquisiciones/{id}/payment.
 * El importe total y la moneda se validan/recalculan en el servidor a partir
 * de la factura/adquisicion; no se confia en el monto enviado por el cliente.
 */
public record PagoAdquisicionRequest(
        Integer paymentMethodId,
        String moneda,
        Boolean confirmacionTerminos
) {}
