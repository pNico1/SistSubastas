package com.subastas.api.dto;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public record LiquidacionVentaResponse(Integer id, Integer productoId, String producto,
        BigDecimal importeBruto, BigDecimal comision, BigDecimal importeNeto,
        String moneda, String estado, String banco, String cuentaTerminadaEn,
        LocalDateTime fechaGenerada, LocalDateTime fechaTransferencia) {}
