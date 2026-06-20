package com.subastas.api.controller;

import com.subastas.api.common.dto.PageResponse;
import com.subastas.api.dto.*;
import com.subastas.api.service.MetricaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Metricas y participacion del cliente autenticado (area 3 — perfil/metricas).
 *
 * Nota: el historial de subastas va en /subastas/historial y no en
 * /api/clientes/me/subastas porque esa ruta ya esta tomada por
 * ClienteSubastaController (subastas en las que el cliente esta unido ahora).
 */
@RestController
@RequestMapping("/api/clientes/me")
public class MetricaController {

    private final MetricaService metricaService;

    public MetricaController(MetricaService metricaService) {
        this.metricaService = metricaService;
    }

    @GetMapping("/asistencias")
    public List<AsistenciaDto> asistencias() {
        return metricaService.getMyAsistencias();
    }

    @GetMapping("/asistencias/estadisticas")
    public AsistenciasStatsDto asistenciasStats(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return metricaService.getAsistenciasStats(from, to);
    }

    @GetMapping("/subastas/historial")
    public List<SubastaHistorialDto> historial() {
        return metricaService.getMySubastasHistory();
    }

    @GetMapping("/victorias")
    public PageResponse<VictoriaDto> victorias(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String auctionCategory,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return metricaService.getMyVictories(from, to, auctionCategory, paymentStatus, page, pageSize);
    }

    @GetMapping("/victorias/estadisticas")
    public VictoriasStatsDto victoriasStats(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String auctionCategory) {
        return metricaService.getVictoriesStats(from, to, auctionCategory);
    }

    @GetMapping("/pujas/estadisticas")
    public PujasStatsDto pujasStats(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Integer subastaId,
            @RequestParam(required = false) String categoria) {
        return metricaService.getMyPujasStats(from, to, subastaId, categoria);
    }
}
