package com.subastas.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CreateMetodoPagoRequest(
        @NotBlank String tipo,      // tarjeta / cuenta_bancaria / cheque
        String marca,
        String banco,
        String numero,              // token de tarjeta o numero de cuenta
        String cbu,
        String titular,
        String vencimiento,
        String codigoSeguridad,
        String moneda,              // ARS / USD
        String alias,
        String tipoCuenta,
        String documento,
        String email,
        String telefono,
        String sucursal,
        String fechaEmision,
        Boolean esInternacional,
        BigDecimal montoGarantia    // para cheque certificado
) {}
