package com.subastas.api.dto;

import java.math.BigDecimal;
import java.util.Map;

/** GET /api/clientes/me/asistencias/estadisticas */
public record AsistenciasStatsDto(
        long totalAsistencias,
        long subastasGanadas,
        long subastasPerdidas,
        BigDecimal totalOfertado,
        BigDecimal totalPagado,
        BigDecimal totalComisiones,
        Map<String, CategoriaResumen> desglosePorCategoria,
        Map<String, MonedaResumen> desglosePorMoneda
) {
    public record CategoriaResumen(long asistencias, long ganadas) {}
    public record MonedaResumen(BigDecimal ofertado, BigDecimal pagado) {}
}
