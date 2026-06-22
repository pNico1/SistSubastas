package com.subastas.api.dto;
public record CuentaCobroResponse(Integer id, String titular, String banco,
        String identificadorBancario, String moneda, String pais, boolean exterior, String estado) {}
