package com.subastas.api.controller;

import com.subastas.api.common.dto.MessageResponse;
import com.subastas.api.dto.*;
import com.subastas.api.service.AdquisicionService;
import com.subastas.api.service.EntregaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes/me/adquisiciones")
public class AdquisicionController {

    private final AdquisicionService service;
    private final EntregaService entregaService;

    public AdquisicionController(AdquisicionService service, EntregaService entregaService) {
        this.service = service;
        this.entregaService = entregaService;
    }

    @GetMapping
    public List<AdquisicionDto> listar(@RequestParam(required = false) String estado) {
        return service.listar(estado);
    }

    @GetMapping("/resumen")
    public AdquisicionResumenDto resumen() {
        return service.getResumen();
    }

    @GetMapping("/{id}")
    public AdquisicionDto getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @GetMapping("/{id}/factura")
    public FacturaDto factura(@PathVariable Integer id) {
        return service.getFactura(id);
    }

    @PostMapping("/{id}/payment")
    public PagoResponse pagar(@PathVariable Integer id, @RequestBody PagoAdquisicionRequest req) {
        return service.pagar(id, req);
    }

    // ---- entrega ----

    @PostMapping("/{id}/entrega/envio")
    public MessageResponse seleccionarEnvio(@PathVariable Integer id, @RequestBody SeleccionEnvioRequest req) {
        return entregaService.seleccionarEnvio(id, req);
    }

    @PostMapping("/{id}/entrega/retiro")
    public MessageResponse seleccionarRetiro(@PathVariable Integer id, @RequestBody SeleccionRetiroRequest req) {
        return entregaService.seleccionarRetiro(id, req);
    }

    @PostMapping("/{id}/confirmar")
    public MessageResponse confirmar(@PathVariable Integer id) {
        return entregaService.confirmarRecepcion(id);
    }

    @GetMapping("/{id}/entrega")
    public EntregaDto entrega(@PathVariable Integer id) {
        return entregaService.getEntrega(id);
    }

    @GetMapping("/{id}/entrega/retiro")
    public PickupDetailsDto entregaRetiro(@PathVariable Integer id) {
        return entregaService.getRetiro(id);
    }

    @GetMapping("/{id}/entrega/envio")
    public ShippingStatusDto entregaEnvio(@PathVariable Integer id) {
        return entregaService.getEnvio(id);
    }
}
