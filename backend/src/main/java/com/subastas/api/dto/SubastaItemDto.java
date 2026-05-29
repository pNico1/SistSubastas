package com.subastas.api.dto;

import java.math.BigDecimal;

public record SubastaItemDto(
        Integer itemId,
        Integer productoId,
        String producto,        // descripcionCatalogo
        BigDecimal precioBase,
        BigDecimal comision,
        String subastado
) {}
