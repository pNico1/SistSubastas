package com.subastas.api.dto;

public record ProductoDto(
        Integer productoId,
        String descripcionCatalogo,
        String descripcionCompleta,
        String estado,
        String disponible,
        String nombreArtista,
        String seguro,
        String estadoOrigen,
        String alertaAutoridades,
        Integer subastaColeccionId
) {}
