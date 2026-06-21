package com.subastas.api.controller;

import com.subastas.api.dto.CreateProductoRequest;
import com.subastas.api.dto.ProductoCreatedDto;
import com.subastas.api.dto.ProductoDto;
import com.subastas.api.dto.*;
import com.subastas.api.service.SeguroService;
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
    private final SeguroService seguroService;

    public ProductoDuenioController(ProductoDuenioService service, SeguroService seguroService) {
        this.service = service;
        this.seguroService = seguroService;
    }

    @GetMapping
    public List<ProductoDto> misProductos() {
        return service.misProductos();
    }

    @GetMapping("/{id}")
    public ProductoDetalleDto getById(@PathVariable Integer id) {
        return service.getDetalleById(id);
    }

    @GetMapping("/{id}/rejectMotive")
    public RejectMotiveResponse getRejectMotive(@PathVariable Integer id) {
        return service.getRejectMotive(id);
    }

    @PatchMapping("/{id}/terminos")
    public TerminosResponse updateProductTermsAcceptance(@PathVariable Integer id,
                                                         @Valid @RequestBody TerminosRequest request) {
        return service.updateProductTermsAcceptance(id, request);
    }

    @GetMapping("/{id}/devolucion")
    public DevolucionResponse getProductReturnDetails(@PathVariable Integer id) {
        return service.getProductReturnDetails(id);
    }

    @GetMapping("/{id}/seguros")
    public SeguroProductoResponse getSegurosByProducto(@PathVariable Integer id) {
        return seguroService.getSegurosByProducto(id);
    }

    @PatchMapping("/{id}/seguros")
    public UpgradeSeguroResponse requestInsuranceUpgrade(@PathVariable Integer id,
                                                         @Valid @RequestBody UpgradeSeguroRequest request) {
        return seguroService.requestInsuranceUpgrade(id, request);
    }

    /** Ofrecer un bien: el dueño carga un producto con fotos (base64). */
    @PostMapping
    public ResponseEntity<ProductoCreatedDto> crear(@Valid @RequestBody CreateProductoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(req));
    }
}
