package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PujaDto(
        Integer id,
        Integer subasta,
        Integer item,
        String producto,
        BigDecimal importe,
        String ganador,
        LocalDateTime fechaHora
) {}
