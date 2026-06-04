package com.subastas.api.controller;

import com.subastas.api.dto.CreateProductoRequest;
import com.subastas.api.dto.ProductoCreatedDto;
import com.subastas.api.dto.ProductoDto;
import com.subastas.api.service.ProductoDuenioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    /** Ofrecer un bien: el dueño carga un producto con fotos (base64). */
    @PostMapping
    public ResponseEntity<ProductoCreatedDto> crear(@Valid @RequestBody CreateProductoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(req));
    }
}
