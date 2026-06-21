package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** GET /api/clientes/me/adquisiciones/{id}/factura */
public record FacturaDto(
        String numeroFactura,
        String cliente,
        String producto,
        BigDecimal importe,
        BigDecimal comision,
        BigDecimal costoEnvio,
        BigDecimal total,
        LocalDateTime fecha
) {}
