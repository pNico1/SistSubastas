package com.subastas.api.dto;

import java.math.BigDecimal;

public record PujaResponse(
        Integer id,
        String mensaje,
        BigDecimal importe
) {}
