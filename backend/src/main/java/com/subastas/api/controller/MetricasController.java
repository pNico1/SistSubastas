package com.subastas.api.controller;

import com.subastas.api.dto.*;
import com.subastas.api.service.MetricaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/me")
public class MetricasController {
    private final MetricaService service;

    public MetricasController(MetricaService service) { this.service = service; }

    @GetMapping("/asistencias")
    public List<AsistenciaDto> getMyAsistencias() { return service.getMyAsistencias(); }

    @GetMapping("/asistencias/estadisticas")
    public AsistenciasStatsResponse getAsistenciasStats() { return service.getAsistenciasStats(); }

    @GetMapping(value = "/subastas", params = "historial=true")
    public List<AsistenciaDto> getMySubastasHistory() { return service.getMySubastasHistory(); }

    @GetMapping("/victorias")
    public List<VictoriaDto> getMyVictories() { return service.getMyVictories(); }

    @GetMapping("/victorias/estadisticas")
    public VictoriasStatsResponse getVictoriesStats() { return service.getVictoriesStats(); }

    @GetMapping("/pujas/estadisticas")
    public PujasStatsResponse getMyPujasStats() { return service.getMyPujasStats(); }
}
