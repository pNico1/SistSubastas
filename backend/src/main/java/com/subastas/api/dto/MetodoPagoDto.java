package com.subastas.api.dto;

public record MetodoPagoDto(
        Integer id,
        String tipo,
        String marca,
        String banco,
        String ultimos4,
        String cbu,
        String titular,
        String moneda,
        String estado
) {}
