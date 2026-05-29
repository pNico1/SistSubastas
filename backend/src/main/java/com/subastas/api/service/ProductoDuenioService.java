package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Producto;
import com.subastas.api.dto.ProductoDto;
import com.subastas.api.repository.ProductoRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.util.List;

/** Productos que el usuario (como dueño) entrego para subastar. */
@Service
public class ProductoDuenioService {

    private final ProductoRepository productoRepo;

    public ProductoDuenioService(ProductoRepository productoRepo) {
        this.productoRepo = productoRepo;
    }

    public List<ProductoDto> misProductos() {
        AuthPrincipal p = CurrentUser.get();
        return productoRepo.findByDuenio(p.personaId()).stream().map(this::toDto).toList();
    }

    public ProductoDto getById(Integer id) {
        AuthPrincipal p = CurrentUser.get();
        Producto prod = productoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
        if (!prod.getDuenio().equals(p.personaId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER_OF_PRODUCTO, "Este producto no es tuyo");
        }
        return toDto(prod);
    }

    private ProductoDto toDto(Producto pr) {
        return new ProductoDto(pr.getIdentificador(), pr.getDescripcionCatalogo(),
                pr.getDescripcionCompleta(), pr.getEstado(), pr.getDisponible(),
                pr.getNombreArtista(), pr.getSeguro());
    }
}
