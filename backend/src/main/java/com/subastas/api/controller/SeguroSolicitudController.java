package com.subastas.api.controller;

import com.subastas.api.dto.SolicitudSeguroAdminResponse;
import com.subastas.api.service.SeguroAdministracionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/solicitudes-seguro")
public class SeguroSolicitudController {
    private final SeguroAdministracionService service;

    public SeguroSolicitudController(SeguroAdministracionService service) {
        this.service = service;
    }

    @GetMapping
    public List<SolicitudSeguroAdminResponse> listar(@RequestParam(required = false) String estado) {
        return service.listar(estado);
    }

    @PutMapping("/{id}/aprobar")
    public SolicitudSeguroAdminResponse aprobar(@PathVariable Integer id) {
        return service.aprobar(id);
    }

    @PutMapping("/{id}/rechazar")
    public SolicitudSeguroAdminResponse rechazar(@PathVariable Integer id) {
        return service.rechazar(id);
    }
}
