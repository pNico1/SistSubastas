package com.subastas.api.controller;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.ItemCatalogo;
import com.subastas.api.dto.ItemFotoDto;
import com.subastas.api.repository.FotoRepository;
import com.subastas.api.repository.ItemCatalogoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Fotos de una pieza de una subasta (area 3).
 * GET /api/subastas/{id}/items/{itemId}/photos — publico (catalogos publicos).
 */
@RestController
@RequestMapping("/api/subastas")
public class ItemFotoController {

    private final ItemCatalogoRepository itemRepo;
    private final FotoRepository fotoRepo;

    public ItemFotoController(ItemCatalogoRepository itemRepo, FotoRepository fotoRepo) {
        this.itemRepo = itemRepo;
        this.fotoRepo = fotoRepo;
    }

    @GetMapping("/{id}/items/{itemId}/photos")
    public List<ItemFotoDto> fotos(@PathVariable Integer id, @PathVariable Integer itemId) {
        ItemCatalogo item = itemRepo.findById(itemId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ITEM_NOT_FOUND, "El item no existe"));
        return fotoRepo.findByProductoOrderByOrden(item.getProducto()).stream()
                .map(f -> new ItemFotoDto(f.getUrl(), f.getOrden(), "HD"))
                .toList();
    }
}
