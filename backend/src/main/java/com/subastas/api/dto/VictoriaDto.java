package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VictoriaDto(Integer adquisicionId, Integer subastaId, Integer productoId,
                          String producto, BigDecimal importe, BigDecimal comision,
                          BigDecimal totalPagado, String moneda, String estado, LocalDateTime fecha) {}
