package com.subastas.api.controller;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Catalogo;
import com.subastas.api.domain.ItemCatalogo;
import com.subastas.api.dto.FotoProductoDto;
import com.subastas.api.repository.CatalogoRepository;
import com.subastas.api.repository.ItemCatalogoRepository;
import com.subastas.api.service.ProductoConsultaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subastas/{subastaId}/items")
public class ItemFotoController {
    private final ItemCatalogoRepository itemRepo;
    private final CatalogoRepository catalogoRepo;
    private final ProductoConsultaService productoService;

    public ItemFotoController(ItemCatalogoRepository itemRepo, CatalogoRepository catalogoRepo,
                              ProductoConsultaService productoService) {
        this.itemRepo = itemRepo;
        this.catalogoRepo = catalogoRepo;
        this.productoService = productoService;
    }

    @GetMapping("/{itemId}/photos")
    public List<FotoProductoDto> getItemPhotos(@PathVariable Integer subastaId,
                                               @PathVariable Integer itemId) {
        ItemCatalogo item = itemRepo.findById(itemId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ITEM_NOT_FOUND, "Item no encontrado"));
        Catalogo catalogo = catalogoRepo.findById(item.getCatalogo())
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CATALOGO_NOT_FOUND, "Catalogo no encontrado"));
        if (!subastaId.equals(catalogo.getSubasta())) {
            throw ApiException.notFound(ErrorCodes.ITEM_NOT_IN_SUBASTA, "El item no pertenece a la subasta");
        }
        return productoService.getFotosProducto(item.getProducto());
    }
}
