package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.*;
import com.subastas.api.dto.*;
import com.subastas.api.repository.*;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdquisicionService {

    private final RegistroDeSubastaRepository rdsRepo;
    private final ProductoRepository productoRepo;
    private final FacturaRepository facturaRepo;
    private final MedioPagoRepository medioPagoRepo;
    private final PagoRepository pagoRepo;
    private final PersonaRepository personaRepo;

    public AdquisicionService(RegistroDeSubastaRepository rdsRepo, ProductoRepository productoRepo,
                              FacturaRepository facturaRepo, MedioPagoRepository medioPagoRepo,
                              PagoRepository pagoRepo, PersonaRepository personaRepo) {
        this.rdsRepo = rdsRepo;
        this.productoRepo = productoRepo;
        this.facturaRepo = facturaRepo;
        this.medioPagoRepo = medioPagoRepo;
        this.pagoRepo = pagoRepo;
        this.personaRepo = personaRepo;
    }

    public List<AdquisicionDto> listar(String estado) {
        AuthPrincipal p = CurrentUser.requireCliente();
        List<RegistroDeSubasta> regs = (estado != null)
                ? rdsRepo.findByClienteAndEstado(p.clienteId(), estado)
                : rdsRepo.findByCliente(p.clienteId());
        return regs.stream().map(this::toDto).toList();
    }

    public AdquisicionDto getById(Integer id) {
        return toDto(requireOwned(id));
    }

    public AdquisicionResumenDto getResumen() {
        AuthPrincipal p = CurrentUser.requireCliente();
        List<RegistroDeSubasta> regs = rdsRepo.findByCliente(p.clienteId());
        BigDecimal total = regs.stream()
                .map(r -> nz(r.getImporte()).add(nz(r.getComision())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new AdquisicionResumenDto(regs.size(), total);
    }

    public FacturaDto getFactura(Integer id) {
        RegistroDeSubasta r = requireOwned(id);
        Factura f = facturaRepo.findByAdquisicion(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.FACTURA_NOT_FOUND,
                        "La adquisicion todavia no tiene factura"));
        String producto = productoRepo.findById(r.getProducto())
                .map(Producto::getDescripcionCatalogo).orElse(null);
        String cliente = personaRepo.findById(r.getCliente())
                .map(per -> (per.getNombre() + " " + nullToEmpty(per.getApellido())).trim())
                .orElse(null);
        return new FacturaDto(f.getNumeroFactura(), cliente, producto,
                f.getImporte(), f.getComision(), f.getCostoEnvio(), f.getTotal(), f.getFecha());
    }

    @Transactional
    public PagoResponse pagar(Integer id, PagoAdquisicionRequest req) {
        AuthPrincipal p = CurrentUser.requireCliente();
        RegistroDeSubasta r = requireOwned(id);

        if ("pagado".equals(r.getEstado()) || "entregado".equals(r.getEstado())) {
            throw ApiException.conflict(ErrorCodes.ADQUISICION_ALREADY_PAID,
                    "La adquisicion ya fue pagada");
        }

        MedioPago medio = requireMedioVerificado(req.paymentMethodId(), p.clienteId());

        // total autoritativo: de la factura si existe, si no importe + comision
        BigDecimal total = facturaRepo.findByAdquisicion(id)
                .map(Factura::getTotal)
                .orElse(nz(r.getImporte()).add(nz(r.getComision())));
        String moneda = (req.moneda() != null) ? req.moneda()
                : (medio.getMoneda() != null ? medio.getMoneda() : "ARS");

        Pago pago = new Pago();
        pago.setAdquisicion(id);
        pago.setMedioPago(medio.getId());
        pago.setImporteTotal(total);
        pago.setMoneda(moneda);
        pago.setEstado("pagado");
        pago.setFechaPago(LocalDateTime.now());
        pagoRepo.save(pago);

        r.setEstado("pagado");
        rdsRepo.save(r);

        return new PagoResponse(pago.getId(), id, "pagado", pago.getFechaPago(), total, moneda,
                new PagoResponse.MedioDePagoRef(medio.getId(), medio.getTipo(), medio.getUltimos4()));
    }

    // ---- helpers ----

    /** Carga la adquisicion y valida que sea del cliente autenticado. */
    private RegistroDeSubasta requireOwned(Integer id) {
        AuthPrincipal p = CurrentUser.requireCliente();
        RegistroDeSubasta r = rdsRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ADQUISICION_NOT_FOUND, "Adquisicion no encontrada"));
        if (!r.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.FORBIDDEN, "Esta adquisicion no es tuya");
        }
        return r;
    }

    private MedioPago requireMedioVerificado(Integer medioPagoId, Integer clienteId) {
        if (medioPagoId == null) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "Falta el medio de pago");
        }
        MedioPago medio = medioPagoRepo.findById(medioPagoId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PAYMENT_METHOD_NOT_FOUND, "Medio de pago no encontrado"));
        if (!medio.getCliente().equals(clienteId)) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER, "El medio de pago no es tuyo");
        }
        if (!"verified".equals(medio.getEstado())) {
            throw ApiException.unprocessable(ErrorCodes.PAYMENT_METHOD_NOT_VERIFIED,
                    "El medio de pago no esta verificado");
        }
        return medio;
    }

    private AdquisicionDto toDto(RegistroDeSubasta r) {
        String desc = productoRepo.findById(r.getProducto())
                .map(Producto::getDescripcionCatalogo).orElse(null);
        return new AdquisicionDto(r.getIdentificador(), r.getProducto(), desc,
                r.getImporte(), r.getComision(), r.getEstado(), r.getFecha());
    }

    private BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private String nullToEmpty(String s) { return s == null ? "" : s; }
}
