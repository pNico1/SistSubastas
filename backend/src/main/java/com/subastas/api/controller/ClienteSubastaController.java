package com.subastas.api.controller;

import com.subastas.api.dto.*;
import com.subastas.api.service.PujaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints del cliente autenticado relacionados a su participacion en subastas
 * y sus pujas (base /api/clientes/me).
 */
@RestController
@RequestMapping("/api/clientes/me")
public class ClienteSubastaController {

    private final PujaService pujaService;

    public ClienteSubastaController(PujaService pujaService) {
        this.pujaService = pujaService;
    }

    @GetMapping("/subastas")
    public List<MySubastaDto> misSubastas() {
        return pujaService.getMisSubastas();
    }

    @PostMapping("/unirse")
    public ResponseEntity<JoinResponse> unirse(@Valid @RequestBody JoinRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pujaService.unirse(req));
    }

    @DeleteMapping("/salir")
    public ResponseEntity<Void> salir() {
        pujaService.salir();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pujas")
    public List<PujaDto> misPujas(
            @RequestParam(required = false) String ganador,
            @RequestParam(required = false) Integer productoId) {
        return pujaService.getMisPujas(ganador, productoId);
    }

    @GetMapping("/pujas/{id}")
    public PujaDto pujaById(@PathVariable Integer id) {
        return pujaService.getPujaById(id);
    }
}
