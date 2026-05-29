package com.subastas.api.dto;

public record CatalogoDto(
        Integer catalogoId,
        String descripcion,
        Integer subastaId
) {}
