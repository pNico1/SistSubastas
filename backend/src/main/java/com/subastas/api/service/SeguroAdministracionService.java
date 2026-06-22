package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.*;
import com.subastas.api.dto.SolicitudSeguroAdminResponse;
import com.subastas.api.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SeguroAdministracionService {
    private final SolicitudAumentoSeguroRepository solicitudRepo;
    private final PagoAumentoSeguroRepository pagoRepo;
    private final ProductoRepository productoRepo;
    private final SeguroRepository seguroRepo;
    private final NotificacionService notificacionService;

    @Value("${app.seguro.tasa-premio:0.02}")
    private BigDecimal tasaPremio;

    public SeguroAdministracionService(SolicitudAumentoSeguroRepository solicitudRepo,
            PagoAumentoSeguroRepository pagoRepo, ProductoRepository productoRepo,
            SeguroRepository seguroRepo, NotificacionService notificacionService) {
        this.solicitudRepo = solicitudRepo;
        this.pagoRepo = pagoRepo;
        this.productoRepo = productoRepo;
        this.seguroRepo = seguroRepo;
        this.notificacionService = notificacionService;
    }

    public List<SolicitudSeguroAdminResponse> listar(String estado) {
        List<SolicitudAumentoSeguro> solicitudes = estado == null || estado.isBlank()
                ? solicitudRepo.findAll()
                : solicitudRepo.findByEstadoOrderByFechaDesc(estado);
        return solicitudes.stream().map(this::toResponse).toList();
    }

    @Transactional
    public SolicitudSeguroAdminResponse aprobar(Integer id) {
        SolicitudAumentoSeguro solicitud = requirePending(id);
        Producto producto = requireProducto(solicitud.getProducto());
        Seguro seguro = requireSeguro(producto);
        BigDecimal valorAnterior = seguro.getImporte();
        BigDecimal diferencia = solicitud.getNuevoValorAsegurado().subtract(valorAnterior);
        if (diferencia.signum() <= 0) {
            throw ApiException.conflict(ErrorCodes.CONFLICT, "El nuevo valor ya no supera la cobertura actual");
        }

        seguro.setImporte(solicitud.getNuevoValorAsegurado());
        seguroRepo.save(seguro);
        solicitud.setEstado("aprobada");
        solicitudRepo.save(solicitud);

        PagoAumentoSeguro pago = new PagoAumentoSeguro();
        pago.setSolicitud(id);
        pago.setImporte(diferencia.multiply(tasaPremio));
        pago.setMoneda("ARS");
        pago.setEstado("pagado");
        pago.setFecha(LocalDateTime.now());
        pagoRepo.save(pago);

        notificacionService.crearParaCliente(producto.getDuenio(), "SEGURO_APROBADO:" + producto.getIdentificador(),
                "Se aprobó el aumento de cobertura y se actualizó el valor asegurado de tu pieza.");
        return toResponse(solicitud);
    }

    @Transactional
    public SolicitudSeguroAdminResponse rechazar(Integer id) {
        SolicitudAumentoSeguro solicitud = requirePending(id);
        Producto producto = requireProducto(solicitud.getProducto());
        solicitud.setEstado("rechazada");
        solicitudRepo.save(solicitud);
        notificacionService.crearParaCliente(producto.getDuenio(), "SEGURO_RECHAZADO:" + producto.getIdentificador(),
                "La solicitud de aumento de cobertura fue rechazada. Podés consultar tu póliza actual.");
        return toResponse(solicitud);
    }

    private SolicitudAumentoSeguro requirePending(Integer id) {
        SolicitudAumentoSeguro solicitud = solicitudRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Solicitud de seguro no encontrada"));
        if (!"pendiente".equals(solicitud.getEstado())) {
            throw ApiException.conflict(ErrorCodes.CONFLICT, "La solicitud ya fue procesada");
        }
        return solicitud;
    }

    private Producto requireProducto(Integer id) {
        return productoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
    }

    private Seguro requireSeguro(Producto producto) {
        return seguroRepo.findById(producto.getSeguro())
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Seguro no encontrado"));
    }

    private SolicitudSeguroAdminResponse toResponse(SolicitudAumentoSeguro solicitud) {
        Producto producto = requireProducto(solicitud.getProducto());
        Seguro seguro = requireSeguro(producto);
        BigDecimal diferencia = solicitud.getNuevoValorAsegurado().subtract(seguro.getImporte()).max(BigDecimal.ZERO);
        BigDecimal pago = pagoRepo.findBySolicitud(solicitud.getId())
                .map(PagoAumentoSeguro::getImporte).orElse(diferencia.multiply(tasaPremio));
        return new SolicitudSeguroAdminResponse(solicitud.getId(), producto.getIdentificador(), producto.getDuenio(),
                seguro.getNroPoliza(), seguro.getCompania(), seguro.getImporte(), solicitud.getNuevoValorAsegurado(),
                pago, "ARS", solicitud.getEstado(), solicitud.getFecha());
    }
}
