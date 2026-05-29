package com.subastas.api.controller;

import com.subastas.api.dto.NotificacionDto;
import com.subastas.api.service.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/me/notifications")
public class NotificacionController {

    private final NotificacionService service;

    public NotificacionController(NotificacionService service) {
        this.service = service;
    }

    @GetMapping
    public List<NotificacionDto> listar() {
        return service.listar();
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> marcarLeida(@PathVariable Integer id) {
        service.marcarLeida(id);
        return ResponseEntity.noContent().build();
    }
}
