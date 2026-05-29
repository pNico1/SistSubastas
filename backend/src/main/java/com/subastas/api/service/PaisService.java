package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Pais;
import com.subastas.api.dto.PaisDto;
import com.subastas.api.repository.PaisRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaisService {

    private final PaisRepository paisRepo;

    public PaisService(PaisRepository paisRepo) {
        this.paisRepo = paisRepo;
    }

    public List<PaisDto> listar(String nombre) {
        List<Pais> paises = (nombre != null && !nombre.isBlank())
                ? paisRepo.findByNombreContainingIgnoreCase(nombre)
                : paisRepo.findAll();
        return paises.stream().map(this::toDto).toList();
    }

    public PaisDto getById(Integer id) {
        return paisRepo.findById(id).map(this::toDto)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PAIS_NOT_FOUND, "El pais no existe"));
    }

    private PaisDto toDto(Pais p) {
        return new PaisDto(p.getNumero(), p.getNombre(), p.getCapital(),
                p.getNacionalidad(), p.getIdiomas());
    }
}
