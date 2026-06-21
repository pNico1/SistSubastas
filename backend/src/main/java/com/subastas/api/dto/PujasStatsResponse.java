package com.subastas.api.dto;

import java.math.BigDecimal;
import java.util.Map;

public record PujasStatsResponse(long total, long ganadoras, BigDecimal importeTotalOfertado,
                                 BigDecimal importePromedio, BigDecimal ofertaMaxima,
                                 Map<String, Long> porCategoria, Map<String, BigDecimal> porMoneda) {}
