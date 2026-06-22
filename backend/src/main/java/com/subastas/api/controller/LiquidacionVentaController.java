package com.subastas.api.controller;
import com.subastas.api.dto.LiquidacionVentaResponse;
import com.subastas.api.service.LiquidacionVentaService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/clientes/me/liquidaciones")
public class LiquidacionVentaController {
    private final LiquidacionVentaService service;
    public LiquidacionVentaController(LiquidacionVentaService service) { this.service = service; }
    @GetMapping public List<LiquidacionVentaResponse> listar() { return service.listar(); }
}
