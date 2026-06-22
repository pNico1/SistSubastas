package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.CompraEmpresa;
import com.subastas.api.domain.Producto;
import com.subastas.api.domain.RegistroDeSubasta;
import com.subastas.api.dto.ObjetoVendidoResponse;
import com.subastas.api.repository.CompraEmpresaRepository;
import com.subastas.api.repository.FotoRepository;
import com.subastas.api.repository.ProductoRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.repository.SubastaRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Base64;

@Service
public class ObjetoVendidoService {

    private final ProductoRepository productoRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final CompraEmpresaRepository compraEmpresaRepo;
    private final SubastaRepository subastaRepo;
    private final FotoRepository fotoRepo;

    public ObjetoVendidoService(ProductoRepository productoRepo,
                                RegistroDeSubastaRepository registroRepo,
                                CompraEmpresaRepository compraEmpresaRepo,
                                SubastaRepository subastaRepo,
                                FotoRepository fotoRepo) {
        this.productoRepo = productoRepo;
        this.registroRepo = registroRepo;
        this.compraEmpresaRepo = compraEmpresaRepo;
        this.subastaRepo = subastaRepo;
        this.fotoRepo = fotoRepo;
    }

    @Transactional(readOnly = true)
    public ObjetoVendidoResponse getVenta(Integer productoId) {
        AuthPrincipal principal = CurrentUser.requireCliente();
        Producto producto = productoRepo.findById(productoId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
        if (!producto.getDuenio().equals(principal.personaId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER_OF_PRODUCTO, "Este producto no es tuyo");
        }

        RegistroDeSubasta venta = registroRepo.findFirstByProducto(productoId).orElse(null);
        if (venta != null) {
            return response(producto, venta.getSubasta(), venta.getFecha(), "POSTOR",
                    venta.getImporte(), venta.getComision(), venta.getEstado());
        }

        CompraEmpresa compra = compraEmpresaRepo.findFirstByProducto(productoId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND,
                        "El producto todavia no tiene una venta registrada"));
        return response(producto, compra.getSubasta(), compra.getFecha(), "EMPRESA",
                compra.getPrecioBase(), compra.getComision(), "pendiente");
    }

    private ObjetoVendidoResponse response(Producto producto, Integer subastaId,
                                           java.time.LocalDateTime fecha, String compradorTipo,
                                           BigDecimal importe, BigDecimal comisionRegistrada, String estadoPago) {
        BigDecimal precio = importe == null ? BigDecimal.ZERO : importe;
        BigDecimal comision = comisionRegistrada == null ? BigDecimal.ZERO : comisionRegistrada;
        String moneda = subastaRepo.findById(subastaId).map(s -> s.getMoneda()).orElse("ARS");
        if (moneda == null || moneda.isBlank()) moneda = "ARS";

        String foto = fotoRepo.findByProductoOrderByOrden(producto.getIdentificador()).stream()
                .filter(f -> f.getFoto() != null && f.getFoto().length > 0)
                .findFirst()
                .map(f -> "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(f.getFoto()))
                .orElse(null);

        return new ObjetoVendidoResponse(producto.getIdentificador(), producto.getDescripcionCatalogo(), foto,
                subastaId, fecha, compradorTipo, precio, comision,
                precio.subtract(comision), moneda, estadoPago == null ? "pendiente" : estadoPago);
    }
}
