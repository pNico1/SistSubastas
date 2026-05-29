package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OfertaActualDto(
        Integer itemId,
        Integer subastaId,
        BigDecimal precioBase,
        BigDecimal ofertaActual,        // null si nadie pujo aun
        Integer numeroPostorActual,     // null si nadie pujo aun
        LocalDateTime timestamp,
        BigDecimal proximaPujaMinima,
        BigDecimal proximaPujaMaxima    // null en subastas oro/platino (sin tope)
) {}
