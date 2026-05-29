package com.subastas.api.controller;

import com.subastas.api.dto.ProductoDto;
import com.subastas.api.service.ProductoDuenioService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/me/productos")
public class ProductoDuenioController {

    private final ProductoDuenioService service;

    public ProductoDuenioController(ProductoDuenioService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductoDto> misProductos() {
        return service.misProductos();
    }

    @GetMapping("/{id}")
    public ProductoDto getById(@PathVariable Integer id) {
        return service.getById(id);
    }
}
