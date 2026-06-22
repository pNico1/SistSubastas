package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdquisicionDto(
        Integer id,
        Integer productoId,
        String producto,
        BigDecimal importe,
        BigDecimal comision,
        String estado,
        LocalDateTime fecha,
        BigDecimal costoEnvio,
        BigDecimal total,
        String moneda,
        boolean entregaDefinida
) {}
