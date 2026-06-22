package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ObjetoVendidoResponse(
        Integer productoId,
        String descripcion,
        String foto,
        Integer subastaId,
        LocalDateTime fechaVenta,
        String compradorTipo,
        BigDecimal importeVenta,
        BigDecimal comisionPorcentaje,
        BigDecimal comisionImporte,
        BigDecimal importeNeto,
        String moneda,
        String estadoPago
) {}
