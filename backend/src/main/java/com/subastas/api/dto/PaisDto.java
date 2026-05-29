package com.subastas.api.dto;

public record PaisDto(
        Integer id,
        String nombre,
        String capital,
        String nacionalidad,
        String idiomas
) {}
