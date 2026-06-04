package com.subastas.api.dto;

/** Respuesta del alta de un producto ("ofrecer un bien"). */
public record ProductoCreatedDto(
        Integer productoId,
        String estado,                // en_revision
        String descripcionCatalogo,
        int cantidadFotos,
        String mensaje
) {}
