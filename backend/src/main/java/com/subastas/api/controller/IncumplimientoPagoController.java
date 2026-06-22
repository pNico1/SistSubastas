package com.subastas.api.controller;

import com.subastas.api.dto.MultaDto;
import com.subastas.api.service.MultaService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clientes/me/adquisiciones")
public class IncumplimientoPagoController {

    private final MultaService service;

    public IncumplimientoPagoController(MultaService service) {
        this.service = service;
    }

    @PostMapping("/{id}/sin-fondos")
    public MultaDto declararFaltaFondos(@PathVariable Integer id) {
        return service.declararFaltaFondos(id);
    }
}
