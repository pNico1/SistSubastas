package com.subastas.api.dto;

import java.math.BigDecimal;

/** GET /api/clientes/me/adquisiciones/resumen */
public record AdquisicionResumenDto(
        long totalCompras,
        BigDecimal totalGastado
) {}
