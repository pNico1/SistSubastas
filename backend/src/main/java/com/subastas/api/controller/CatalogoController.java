package com.subastas.api.controller;

import com.subastas.api.common.dto.PageResponse;
import com.subastas.api.dto.CatalogoDto;
import com.subastas.api.repository.CatalogoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/catalogos")
public class CatalogoController {
    private final CatalogoRepository catalogoRepo;

    public CatalogoController(CatalogoRepository catalogoRepo) {
        this.catalogoRepo = catalogoRepo;
    }

    @GetMapping
    public PageResponse<CatalogoDto> listarCatalogos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        var result = catalogoRepo.findAll(PageRequest.of(Math.max(page, 0), safeSize,
                Sort.by(Sort.Direction.ASC, "identificador")))
                .map(c -> new CatalogoDto(c.getIdentificador(), c.getDescripcion(), c.getSubasta()));
        return PageResponse.from(result);
    }
}
