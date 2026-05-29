package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MultaDto(
        Integer id,
        BigDecimal importe,
        String estado,
        LocalDate fechaLimite
) {}
