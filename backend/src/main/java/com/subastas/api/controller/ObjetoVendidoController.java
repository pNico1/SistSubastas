package com.subastas.api.controller;

import com.subastas.api.dto.ObjetoVendidoResponse;
import com.subastas.api.service.ObjetoVendidoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clientes/me/productos")
public class ObjetoVendidoController {

    private final ObjetoVendidoService service;

    public ObjetoVendidoController(ObjetoVendidoService service) {
        this.service = service;
    }

    @GetMapping("/{id}/venta")
    public ObjetoVendidoResponse getObjetoVendido(@PathVariable Integer id) {
        return service.getVenta(id);
    }
}
