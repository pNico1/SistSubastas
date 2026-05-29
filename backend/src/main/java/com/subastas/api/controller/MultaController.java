package com.subastas.api.controller;

import com.subastas.api.dto.MultaDto;
import com.subastas.api.service.MultaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/me/fines")
public class MultaController {

    private final MultaService service;

    public MultaController(MultaService service) {
        this.service = service;
    }

    @GetMapping
    public List<MultaDto> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public MultaDto getById(@PathVariable Integer id) {
        return service.getById(id);
    }
}
