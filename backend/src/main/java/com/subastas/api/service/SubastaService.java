package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.common.dto.PageResponse;
import com.subastas.api.domain.*;
import com.subastas.api.dto.*;
import com.subastas.api.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SubastaService {

    private final SubastaRepository subastaRepo;
    private final CatalogoRepository catalogoRepo;
    private final ItemCatalogoRepository itemRepo;
    private final ProductoRepository productoRepo;
    private final PujoRepository pujoRepo;
    private final AsistenteRepository asistenteRepo;

    public SubastaService(SubastaRepository subastaRepo, CatalogoRepository catalogoRepo,
                          ItemCatalogoRepository itemRepo, ProductoRepository productoRepo,
                          PujoRepository pujoRepo, AsistenteRepository asistenteRepo) {
        this.subastaRepo = subastaRepo;
        this.catalogoRepo = catalogoRepo;
        this.itemRepo = itemRepo;
        this.productoRepo = productoRepo;
        this.pujoRepo = pujoRepo;
        this.asistenteRepo = asistenteRepo;
    }

    public PageResponse<SubastaDto> listar(String estado, String categoria, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("fecha").ascending());
        Page<Subasta> result;
        if (estado != null && categoria != null) {
            result = subastaRepo.findByEstadoAndCategoria(estado, categoria, pageable);
        } else if (estado != null) {
            result = subastaRepo.findByEstado(estado, pageable);
        } else if (categoria != null) {
            result = subastaRepo.findByCategoria(categoria, pageable);
        } else {
            result = subastaRepo.findAll(pageable);
        }
        return PageResponse.from(result.map(this::toDto));
    }

    public SubastaDto getById(Integer id) {
        return toDto(findSubasta(id));
    }

    public String getEstado(Integer id) {
        return findSubasta(id).getEstado();
    }

    public CatalogoDto getCatalogo(Integer subastaId) {
        findSubasta(subastaId);
        Catalogo c = catalogoRepo.findBySubasta(subastaId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CATALOGO_NOT_FOUND,
                        "La subasta no tiene catalogo"));
        return new CatalogoDto(c.getIdentificador(), c.getDescripcion(), c.getSubasta());
    }

    public List<SubastaItemDto> getItems(Integer subastaId) {
        findSubasta(subastaId);
        Catalogo c = catalogoRepo.findBySubasta(subastaId).orElse(null);
        if (c == null) return List.of();
        return itemRepo.findByCatalogo(c.getIdentificador()).stream()
                .map(this::toItemDto)
                .toList();
    }

    public OfertaActualDto getOfertaActual(Integer subastaId, Integer itemId) {
        Subasta subasta = findSubasta(subastaId);
        ItemCatalogo item = findItemEnSubasta(subastaId, itemId);

        Pujo top = pujoRepo.findTopByItemOrderByImporteDesc(itemId).orElse(null);
        BigDecimal ofertaActual = (top != null) ? top.getImporte() : null;
        Integer numeroPostor = (top != null)
                ? asistenteRepo.findById(top.getAsistente()).map(Asistente::getNumeroPostor).orElse(null)
                : null;

        PujaRules.Limites lim = PujaRules.calcular(item.getPrecioBase(), ofertaActual, subasta.getCategoria());

        return new OfertaActualDto(
                itemId, subastaId, item.getPrecioBase(), ofertaActual, numeroPostor,
                top != null ? top.getFechaHora() : null,
                lim.minima(), lim.maxima()
        );
    }

    public List<PujaDto> getPujasHistory(Integer subastaId, Integer itemId) {
        findItemEnSubasta(subastaId, itemId);
        return pujoRepo.findByItemOrderByFechaHoraAsc(itemId).stream()
                .map(p -> new PujaDto(p.getIdentificador(), subastaId, itemId,
                        null, p.getImporte(), p.getGanador(), p.getFechaHora()))
                .toList();
    }

    // ---- helpers compartidos ----

    public Subasta findSubasta(Integer id) {
        return subastaRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.SUBASTA_NOT_FOUND, "La subasta no existe"));
    }

    /** Busca el item y valida que pertenezca al catalogo de la subasta. */
    public ItemCatalogo findItemEnSubasta(Integer subastaId, Integer itemId) {
        ItemCatalogo item = itemRepo.findById(itemId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ITEM_NOT_FOUND, "El item no existe"));
        Catalogo catalogo = catalogoRepo.findById(item.getCatalogo()).orElse(null);
        if (catalogo == null || catalogo.getSubasta() == null
                || !catalogo.getSubasta().equals(subastaId)) {
            throw ApiException.conflict(ErrorCodes.ITEM_NOT_IN_SUBASTA, "El item no pertenece a la subasta");
        }
        return item;
    }

    private SubastaDto toDto(Subasta s) {
        int cantidad = catalogoRepo.findBySubasta(s.getIdentificador())
                .map(c -> itemRepo.findByCatalogo(c.getIdentificador()).size())
                .orElse(0);
        return new SubastaDto(s.getIdentificador(), s.getFecha(), s.getHora(), s.getEstado(),
                s.getCategoria(), s.getMoneda(), s.getUbicacion(), cantidad);
    }

    private SubastaItemDto toItemDto(ItemCatalogo i) {
        String desc = productoRepo.findById(i.getProducto())
                .map(Producto::getDescripcionCatalogo).orElse(null);
        return new SubastaItemDto(i.getIdentificador(), i.getProducto(), desc,
                i.getPrecioBase(), i.getComision(), i.getSubastado());
    }
}
