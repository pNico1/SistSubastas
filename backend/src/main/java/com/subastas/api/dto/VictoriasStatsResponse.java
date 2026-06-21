package com.subastas.api.dto;

import java.math.BigDecimal;
import java.util.Map;

public record VictoriasStatsResponse(long total, Map<String, Long> porCategoria,
                                     Map<String, BigDecimal> importesPorMoneda) {}
