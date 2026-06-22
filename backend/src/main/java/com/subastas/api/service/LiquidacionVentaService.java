package com.subastas.api.service;

import com.subastas.api.domain.*;
import com.subastas.api.dto.LiquidacionVentaResponse;
import com.subastas.api.repository.*;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LiquidacionVentaService {
    private final LiquidacionVentaRepository repo;
    private final CuentaCobroService cuentaService;
    private final CuentaCobroRepository cuentaRepo;
    private final ProductoRepository productoRepo;
    private final NotificacionService notificacionService;
    public LiquidacionVentaService(LiquidacionVentaRepository repo, CuentaCobroService cuentaService,
            CuentaCobroRepository cuentaRepo, ProductoRepository productoRepo, NotificacionService notificacionService) {
        this.repo = repo; this.cuentaService = cuentaService; this.cuentaRepo = cuentaRepo;
        this.productoRepo = productoRepo; this.notificacionService = notificacionService;
    }

    @Transactional
    public void registrar(Producto producto, Integer adquisicion, Integer compraEmpresa,
                          BigDecimal bruto, BigDecimal comision, String moneda, boolean inmediata) {
        if (repo.findByProducto(producto.getIdentificador()).isPresent()) return;
        CuentaCobro cuenta = cuentaRepo.findFirstByDuenioAndEstadoOrderByFechaDesc(producto.getDuenio(), "activa")
                .orElse(null);
        if (cuenta == null) {
            notificacionService.crearParaCliente(producto.getDuenio(), "CUENTA_COBRO_REQUERIDA:" + producto.getIdentificador(),
                    "Declarà una cuenta bancaria para poder recibir la liquidación de tu pieza vendida.");
            return;
        }
        LiquidacionVenta l = new LiquidacionVenta();
        l.setProducto(producto.getIdentificador()); l.setDuenio(producto.getDuenio());
        l.setAdquisicion(adquisicion); l.setCompraEmpresa(compraEmpresa); l.setCuentaCobro(cuenta.getId());
        l.setImporteBruto(nz(bruto)); l.setComision(nz(comision)); l.setImporteNeto(nz(bruto).subtract(nz(comision)));
        l.setMoneda(moneda == null ? "ARS" : moneda); l.setEstado(inmediata ? "enviada" : "pendiente");
        l.setFechaGenerada(LocalDateTime.now()); if (inmediata) l.setFechaTransferencia(LocalDateTime.now());
        l = repo.save(l);
        if (inmediata) notificacionService.crearParaCliente(producto.getDuenio(), "LIQUIDACION_ENVIADA:" + l.getId(),
                "La empresa transfirió el importe neto de la pieza comprada por valor base.");
    }

    @Transactional
    public void confirmarPorAdquisicion(Integer adquisicion) {
        repo.findByAdquisicion(adquisicion).ifPresent(l -> {
            if ("enviada".equals(l.getEstado())) return;
            l.setEstado("enviada"); l.setFechaTransferencia(LocalDateTime.now()); repo.save(l);
            notificacionService.crearParaCliente(l.getDuenio(), "LIQUIDACION_ENVIADA:" + l.getId(),
                    "El pago de tu pieza vendida fue transferido a la cuenta declarada.");
        });
    }

    public List<LiquidacionVentaResponse> listar() {
        Integer duenio = CurrentUser.requireCliente().personaId();
        return repo.findByDuenioOrderByFechaGeneradaDesc(duenio).stream().map(this::toResponse).toList();
    }

    private LiquidacionVentaResponse toResponse(LiquidacionVenta l) {
        CuentaCobro c = cuentaRepo.findById(l.getCuentaCobro()).orElse(null);
        String desc = productoRepo.findById(l.getProducto()).map(Producto::getDescripcionCatalogo).orElse(null);
        String id = c == null ? "" : c.getIdentificadorBancario();
        return new LiquidacionVentaResponse(l.getId(), l.getProducto(), desc, l.getImporteBruto(), l.getComision(),
                l.getImporteNeto(), l.getMoneda(), l.getEstado(), c == null ? null : c.getBanco(),
                id.length() <= 4 ? id : id.substring(id.length() - 4), l.getFechaGenerada(), l.getFechaTransferencia());
    }
    private BigDecimal nz(BigDecimal n) { return n == null ? BigDecimal.ZERO : n; }
}
