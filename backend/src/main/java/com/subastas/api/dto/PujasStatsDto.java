package com.subastas.api.dto;

import java.math.BigDecimal;
import java.util.Map;

/** GET /api/clientes/me/pujas/estadisticas */
public record PujasStatsDto(
        long totalPujas,
        long pujasGanadoras,
        long pujasPerdidas,
        BigDecimal montoTotalOfertado,
        BigDecimal montoTotalGanado,
        BigDecimal pujaPromedio,
        BigDecimal pujaMasAlta,
        Map<String, Long> desglosePorCategoria,
        Map<String, BigDecimal> desglosePorMoneda
) {}
