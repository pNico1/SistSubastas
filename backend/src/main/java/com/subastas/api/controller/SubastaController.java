package com.subastas.api.controller;

import com.subastas.api.common.dto.PageResponse;
import com.subastas.api.dto.*;
import com.subastas.api.service.PujaService;
import com.subastas.api.service.SubastaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subastas")
public class SubastaController {

    private final SubastaService subastaService;
    private final PujaService pujaService;

    public SubastaController(SubastaService subastaService, PujaService pujaService) {
        this.subastaService = subastaService;
        this.pujaService = pujaService;
    }

    @GetMapping
    public PageResponse<SubastaDto> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String categoria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return subastaService.listar(estado, categoria, page, pageSize);
    }

    @GetMapping("/{id}")
    public SubastaDto getById(@PathVariable Integer id) {
        return subastaService.getById(id);
    }

    @GetMapping("/{id}/estado")
    public Map<String, String> getEstado(@PathVariable Integer id) {
        return Map.of("estado", subastaService.getEstado(id));
    }

    @GetMapping("/{id}/item-activo")
    public ItemActivoDto getItemActivo(@PathVariable Integer id) {
        return subastaService.getItemActivo(id);
    }

    @GetMapping("/{id}/catalogo")
    public CatalogoDto getCatalogo(@PathVariable Integer id) {
        return subastaService.getCatalogo(id);
    }

    @GetMapping("/{id}/items")
    public List<SubastaItemDto> getItems(@PathVariable Integer id) {
        return subastaService.getItems(id);
    }

    @GetMapping("/{id}/items/{itemId}/oferta-actual")
    public OfertaActualDto getOfertaActual(@PathVariable Integer id, @PathVariable Integer itemId) {
        return subastaService.getOfertaActual(id, itemId);
    }

    @GetMapping("/{id}/items/{itemId}/puja-actual")
    public Map<String, Object> getPujaActual(@PathVariable Integer id, @PathVariable Integer itemId) {
        OfertaActualDto oferta = subastaService.getOfertaActual(id, itemId);
        return java.util.Collections.singletonMap("precioActual",
                oferta.ofertaActual() == null ? oferta.precioBase() : oferta.ofertaActual());
    }

    @GetMapping("/{id}/items/{itemId}/pujas")
    public List<PujaDto> getPujasHistory(@PathVariable Integer id, @PathVariable Integer itemId) {
        return subastaService.getPujasHistory(id, itemId);
    }

    @PostMapping("/{id}/items/{itemId}/pujas")
    public ResponseEntity<PujaResponse> crearPuja(@PathVariable Integer id,
                                                  @PathVariable Integer itemId,
                                                  @Valid @RequestBody CreatePujaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pujaService.crearPuja(id, itemId, req));
    }
}
