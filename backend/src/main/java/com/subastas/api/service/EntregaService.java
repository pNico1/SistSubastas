package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.common.dto.MessageResponse;
import com.subastas.api.domain.Entrega;
import com.subastas.api.domain.Factura;
import com.subastas.api.domain.RegistroDeSubasta;
import com.subastas.api.dto.*;
import com.subastas.api.repository.EntregaRepository;
import com.subastas.api.repository.FacturaRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.repository.SubastaRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Circuito de entrega de una adquisicion (area 1): el comprador elige envio o
 * retiro, consulta el estado y confirma la recepcion.
 */
@Service
public class EntregaService {

    private static final String DEPOSITO = "Deposito Central - Sector B";

    private final EntregaRepository entregaRepo;
    private final RegistroDeSubastaRepository rdsRepo;
    private final FacturaRepository facturaRepo;
    private final SubastaRepository subastaRepo;

    @Value("${app.entregas.costo-envio-ars:15000}")
    private BigDecimal costoEnvioArs;

    @Value("${app.entregas.costo-envio-usd:50}")
    private BigDecimal costoEnvioUsd;

    public EntregaService(EntregaRepository entregaRepo, RegistroDeSubastaRepository rdsRepo,
                          FacturaRepository facturaRepo, SubastaRepository subastaRepo) {
        this.entregaRepo = entregaRepo;
        this.rdsRepo = rdsRepo;
        this.facturaRepo = facturaRepo;
        this.subastaRepo = subastaRepo;
    }

    @Transactional
    public MessageResponse seleccionarEnvio(Integer adquisicionId, SeleccionEnvioRequest req) {
        RegistroDeSubasta adquisicion = requireOwned(adquisicionId);
        requireSinEntrega(adquisicionId);
        if (req == null || req.direccion() == null || req.direccion().isBlank()) {
            throw ApiException.unprocessable(ErrorCodes.INVALID_DATA, "La direccion de envio es obligatoria");
        }
        Entrega e = new Entrega();
        e.setAdquisicion(adquisicionId);
        e.setTipo("envio");
        e.setEstado("pendiente");
        e.setDireccion(req.direccion());
        e.setTransportista("Andreani");
        e.setCodigoSeguimiento("AE" + UUID.randomUUID().toString().substring(0, 9).toUpperCase());
        e.setFechaEstimada(LocalDate.now().plusDays(7));
        entregaRepo.save(e);
        generarFactura(adquisicion, costoEnvio(adquisicion));
        return MessageResponse.of("Entrega por envio seleccionada");
    }

    @Transactional
    public MessageResponse seleccionarRetiro(Integer adquisicionId, SeleccionRetiroRequest req) {
        RegistroDeSubasta adquisicion = requireOwned(adquisicionId);
        requireSinEntrega(adquisicionId);
        if (req == null || !Boolean.TRUE.equals(req.confirmar())) {
            throw ApiException.unprocessable(ErrorCodes.INVALID_DATA, "Debes confirmar el retiro");
        }
        Entrega e = new Entrega();
        e.setAdquisicion(adquisicionId);
        e.setTipo("retiro");
        e.setEstado("pendiente");
        e.setDireccion(DEPOSITO);
        e.setCodigoRetiro("RET-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        e.setFechaEstimada(LocalDate.now().plusDays(3));
        entregaRepo.save(e);
        generarFactura(adquisicion, BigDecimal.ZERO);
        return MessageResponse.of("Entrega por retiro seleccionada");
    }

    @Transactional
    public MessageResponse confirmarRecepcion(Integer adquisicionId) {
        RegistroDeSubasta r = requireOwned(adquisicionId);
        Entrega e = entregaRepo.findByAdquisicion(adquisicionId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ENTREGA_NOT_FOUND, "No hay entrega para confirmar"));
        if ("confirmada".equals(e.getEstado())) {
            throw ApiException.conflict(ErrorCodes.DELIVERY_NOT_CONFIRMABLE, "La entrega ya fue confirmada");
        }
        e.setEstado("confirmada");
        entregaRepo.save(e);
        r.setEstado("entregado");
        rdsRepo.save(r);
        return MessageResponse.of("Entrega confirmada correctamente");
    }

    public EntregaDto getEntrega(Integer adquisicionId) {
        requireOwned(adquisicionId);
        Entrega e = entregaRepo.findByAdquisicion(adquisicionId)
                .orElseThrow(() -> ApiException.conflict(ErrorCodes.ENTREGA_NOT_GENERATED,
                        "La entrega todavia no fue generada"));
        return new EntregaDto(e.getId(), e.getTipo(), e.getEstado(), e.getDireccion(), e.getFechaEstimada());
    }

    public PickupDetailsDto getRetiro(Integer adquisicionId) {
        Entrega e = requireEntregaDeTipo(adquisicionId, "retiro");
        return new PickupDetailsDto(e.getDireccion(), "9 a 18", e.getCodigoRetiro());
    }

    public ShippingStatusDto getEnvio(Integer adquisicionId) {
        Entrega e = requireEntregaDeTipo(adquisicionId, "envio");
        return new ShippingStatusDto(e.getEstado(), e.getFechaEstimada());
    }

    // ---- helpers ----

    private RegistroDeSubasta requireOwned(Integer adquisicionId) {
        AuthPrincipal p = CurrentUser.requireCliente();
        RegistroDeSubasta r = rdsRepo.findById(adquisicionId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ADQUISICION_NOT_FOUND, "Adquisicion no encontrada"));
        if (!r.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.FORBIDDEN, "Esta adquisicion no es tuya");
        }
        return r;
    }

    private void requireSinEntrega(Integer adquisicionId) {
        if (entregaRepo.findByAdquisicion(adquisicionId).isPresent()) {
            throw ApiException.conflict(ErrorCodes.ENTREGA_ALREADY_DEFINED,
                    "Ya elegiste el tipo de entrega para esta adquisicion");
        }
    }

    private Entrega requireEntregaDeTipo(Integer adquisicionId, String tipo) {
        requireOwned(adquisicionId);
        Entrega e = entregaRepo.findByAdquisicion(adquisicionId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ENTREGA_NOT_FOUND, "No existe entrega"));
        if (!tipo.equals(e.getTipo())) {
            throw ApiException.notFound(ErrorCodes.DELIVERY_TYPE_MISMATCH,
                    "La entrega no es de tipo " + tipo);
        }
        return e;
    }

    private BigDecimal costoEnvio(RegistroDeSubasta adquisicion) {
        String moneda = subastaRepo.findById(adquisicion.getSubasta())
                .map(s -> s.getMoneda()).orElse("ARS");
        return "USD".equalsIgnoreCase(moneda) ? costoEnvioUsd : costoEnvioArs;
    }

    private void generarFactura(RegistroDeSubasta r, BigDecimal costoEnvio) {
        Factura f = facturaRepo.findByAdquisicion(r.getIdentificador()).orElseGet(Factura::new);
        f.setAdquisicion(r.getIdentificador());
        f.setNumeroFactura("F" + r.getSubasta() + "-" + r.getIdentificador());
        f.setImporte(nz(r.getImporte()));
        f.setComision(nz(r.getComision()));
        f.setCostoEnvio(nz(costoEnvio));
        f.setTotal(nz(r.getImporte()).add(nz(r.getComision())).add(nz(costoEnvio)));
        if (f.getFecha() == null) f.setFecha(LocalDateTime.now());
        facturaRepo.save(f);
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
