package com.subastas.api.dto;

import java.math.BigDecimal;
import java.util.Map;

/** GET /api/clientes/me/victorias/estadisticas */
public record VictoriasStatsDto(
        long totalWins,
        BigDecimal totalSpent,
        Map<String, BigDecimal> totalSpentByCurrency
) {}
