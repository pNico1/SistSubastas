package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.*;
import com.subastas.api.dto.FotoProductoDto;
import com.subastas.api.dto.ProductoDetalleDto;
import com.subastas.api.repository.*;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;

@Service
public class ProductoConsultaService {
    private final ProductoRepository productoRepo;
    private final FotoRepository fotoRepo;
    private final ItemCatalogoRepository itemRepo;
    private final CatalogoRepository catalogoRepo;
    private final SubastaRepository subastaRepo;
    private final SeguroRepository seguroRepo;

    public ProductoConsultaService(ProductoRepository productoRepo, FotoRepository fotoRepo,
                                   ItemCatalogoRepository itemRepo, CatalogoRepository catalogoRepo,
                                   SubastaRepository subastaRepo, SeguroRepository seguroRepo) {
        this.productoRepo = productoRepo;
        this.fotoRepo = fotoRepo;
        this.itemRepo = itemRepo;
        this.catalogoRepo = catalogoRepo;
        this.subastaRepo = subastaRepo;
        this.seguroRepo = seguroRepo;
    }

    public ProductoDetalleDto getProductoById(Integer id) {
        return toDetalle(requireProducto(id));
    }

    public List<FotoProductoDto> getFotosProducto(Integer id) {
        requireProducto(id);
        return fotoRepo.findByProductoOrderByOrden(id).stream().map(this::toFotoDto).toList();
    }

    public List<ProductoDetalleDto> filterProductos(String disponible, Integer duenio) {
        List<Producto> productos;
        if (disponible != null && duenio != null) {
            productos = productoRepo.findByDisponibleAndDuenio(disponible, duenio);
        } else if (disponible != null) {
            productos = productoRepo.findByDisponible(disponible);
        } else if (duenio != null) {
            productos = productoRepo.findByDuenio(duenio);
        } else {
            productos = productoRepo.findAll();
        }
        return productos.stream().map(this::toDetalle).toList();
    }

    public List<Producto> searchProductos(String search) {
        return search == null || search.isBlank()
                ? productoRepo.findAll()
                : productoRepo.findByDescripcionCatalogoContainingIgnoreCase(search.trim());
    }

    public ProductoDetalleDto toDetalle(Producto producto) {
        boolean puedeVerPrecio = CurrentUser.isAuthenticated();
        ItemCatalogo item = itemRepo.findFirstByProducto(producto.getIdentificador()).orElse(null);
        Catalogo catalogo = item == null ? null : catalogoRepo.findById(item.getCatalogo()).orElse(null);
        Subasta subasta = catalogo == null || catalogo.getSubasta() == null
                ? null : subastaRepo.findById(catalogo.getSubasta()).orElse(null);
        Seguro seguro = producto.getSeguro() == null
                ? null : seguroRepo.findById(producto.getSeguro()).orElse(null);

        List<String> fotos = fotoRepo.findByProductoOrderByOrden(producto.getIdentificador()).stream()
                .map(this::fotoContenido).toList();
        ProductoDetalleDto.PolizaDto poliza = seguro == null || !puedeVerPrecio ? null
                : new ProductoDetalleDto.PolizaDto(seguro.getNroPoliza(), cobertura(seguro),
                    seguro.getImporte(), seguro.getCompania());

        return new ProductoDetalleDto(
                producto.getIdentificador(), producto.getIdentificador(), producto.getDescripcionCatalogo(),
                producto.getDescripcionCompleta(), producto.getEstado(), producto.getDisponible(),
                producto.getNombreArtista(), producto.getFechaObra(), producto.getHistoria(),
                producto.getTerminosAceptados(), item == null || !puedeVerPrecio ? null : item.getPrecioBase(),
                item == null || !puedeVerPrecio ? null : item.getComision(), subasta == null ? null : subasta.getMoneda(),
                subasta == null ? null : subasta.getIdentificador(), subasta == null ? null : subasta.getFecha(),
                subasta == null ? null : subasta.getHora(), subasta == null ? null : subasta.getUbicacion(),
                poliza, fotos);
    }

    private Producto requireProducto(Integer id) {
        return productoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
    }

    private FotoProductoDto toFotoDto(Foto foto) {
        String base64 = foto.getFoto() == null ? null : Base64.getEncoder().encodeToString(foto.getFoto());
        return new FotoProductoDto(foto.getIdentificador(), foto.getUrl(), foto.getOrden(), base64);
    }

    private String fotoContenido(Foto foto) {
        if (foto.getUrl() != null && !foto.getUrl().isBlank()) return foto.getUrl();
        return foto.getFoto() == null ? null : Base64.getEncoder().encodeToString(foto.getFoto());
    }

    private String cobertura(Seguro seguro) {
        return "si".equalsIgnoreCase(seguro.getPolizaCombinada())
                ? "Póliza combinada" : "Cobertura individual";
    }
}
