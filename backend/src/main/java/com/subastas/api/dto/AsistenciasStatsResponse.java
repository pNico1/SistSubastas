package com.subastas.api.dto;

import java.util.Map;

public record AsistenciasStatsResponse(long total, Map<String, Long> porCategoria,
                                       long abiertas, long cerradas) {}
