package com.subastas.api.dto;

/** GET /api/subastas/{id}/items/{itemId}/photos */
public record ItemFotoDto(
        String url,
        Integer orden,
        String resolucion
) {}
