package com.subastas.api.controller;

import com.subastas.api.dto.PaisDto;
import com.subastas.api.service.PaisService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/paises")
public class PaisController {

    private final PaisService paisService;

    public PaisController(PaisService paisService) {
        this.paisService = paisService;
    }

    @GetMapping
    public List<PaisDto> listar(@RequestParam(required = false) String nombre) {
        return paisService.listar(nombre);
    }

    @GetMapping("/{id}")
    public PaisDto getById(@PathVariable Integer id) {
        return paisService.getById(id);
    }
}
