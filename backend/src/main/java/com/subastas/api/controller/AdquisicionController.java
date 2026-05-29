package com.subastas.api.controller;

import com.subastas.api.dto.AdquisicionDto;
import com.subastas.api.service.AdquisicionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/me/adquisiciones")
public class AdquisicionController {

    private final AdquisicionService service;

    public AdquisicionController(AdquisicionService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdquisicionDto> listar(@RequestParam(required = false) String estado) {
        return service.listar(estado);
    }

    @GetMapping("/{id}")
    public AdquisicionDto getById(@PathVariable Integer id) {
        return service.getById(id);
    }
}
