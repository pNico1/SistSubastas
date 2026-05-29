package com.subastas.api.controller;

import com.subastas.api.dto.CreateMetodoPagoRequest;
import com.subastas.api.dto.MetodoPagoDto;
import com.subastas.api.service.MetodoPagoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/me/metodos-pago")
public class MetodoPagoController {

    private final MetodoPagoService service;

    public MetodoPagoController(MetodoPagoService service) {
        this.service = service;
    }

    @GetMapping
    public List<MetodoPagoDto> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public MetodoPagoDto getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<MetodoPagoDto> crear(@Valid @RequestBody CreateMetodoPagoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
