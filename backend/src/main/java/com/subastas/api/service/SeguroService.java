package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Producto;
import com.subastas.api.domain.Seguro;
import com.subastas.api.domain.SolicitudAumentoSeguro;
import com.subastas.api.dto.SeguroProductoResponse;
import com.subastas.api.dto.UpgradeSeguroRequest;
import com.subastas.api.dto.UpgradeSeguroResponse;
import com.subastas.api.repository.ProductoRepository;
import com.subastas.api.repository.SeguroRepository;
import com.subastas.api.repository.SolicitudAumentoSeguroRepository;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class SeguroService {
    private final ProductoRepository productoRepo;
    private final SeguroRepository seguroRepo;
    private final SolicitudAumentoSeguroRepository solicitudRepo;

    public SeguroService(ProductoRepository productoRepo, SeguroRepository seguroRepo,
                         SolicitudAumentoSeguroRepository solicitudRepo) {
        this.productoRepo = productoRepo;
        this.seguroRepo = seguroRepo;
        this.solicitudRepo = solicitudRepo;
    }

    public SeguroProductoResponse getSegurosByProducto(Integer productoId) {
        Producto producto = requireOwned(productoId);
        Seguro seguro = requireSeguro(producto);
        String estadoSolicitud = solicitudRepo
                .findFirstByProductoAndEstadoOrderByFechaDesc(productoId, "pendiente")
                .map(SolicitudAumentoSeguro::getEstado).orElse(null);
        String cobertura = "si".equalsIgnoreCase(seguro.getPolizaCombinada())
                ? "Póliza combinada" : "Cobertura individual";
        return new SeguroProductoResponse(seguro.getNroPoliza(), cobertura,
                seguro.getImporte(), "ARS", seguro.getImporte(), new BigDecimal("0.02"),
                seguro.getCompania(), estadoSolicitud);
    }

    @Transactional
    public UpgradeSeguroResponse requestInsuranceUpgrade(Integer productoId, UpgradeSeguroRequest request) {
        Producto producto = requireOwned(productoId);
        Seguro seguro = requireSeguro(producto);
        if (request.nuevoValorAsegurado().compareTo(seguro.getImporte()) <= 0) {
            throw ApiException.unprocessable(ErrorCodes.INVALID_DATA,
                    "El nuevo valor asegurado debe ser mayor al actual");
        }
        if (solicitudRepo.findFirstByProductoAndEstadoOrderByFechaDesc(productoId, "pendiente").isPresent()) {
            throw ApiException.conflict(ErrorCodes.CONFLICT, "Ya existe una solicitud pendiente para este producto");
        }
        SolicitudAumentoSeguro solicitud = new SolicitudAumentoSeguro();
        solicitud.setProducto(productoId);
        solicitud.setNuevoValorAsegurado(request.nuevoValorAsegurado());
        solicitud.setEstado("pendiente");
        solicitud.setFecha(LocalDateTime.now());
        solicitud = solicitudRepo.save(solicitud);
        return new UpgradeSeguroResponse(solicitud.getId(), productoId, solicitud.getNuevoValorAsegurado(),
                solicitud.getEstado(), solicitud.getFecha());
    }

    private Producto requireOwned(Integer id) {
        Producto producto = productoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
        if (!producto.getDuenio().equals(CurrentUser.get().personaId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER_OF_PRODUCTO, "Este producto no es tuyo");
        }
        return producto;
    }

    private Seguro requireSeguro(Producto producto) {
        if (producto.getSeguro() == null) {
            throw ApiException.notFound(ErrorCodes.NOT_FOUND, "El producto no tiene un seguro asignado");
        }
        return seguroRepo.findById(producto.getSeguro())
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Seguro no encontrado"));
    }
}
