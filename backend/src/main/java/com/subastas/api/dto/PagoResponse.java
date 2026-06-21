package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Respuesta de un pago de adquisicion. */
public record PagoResponse(
        Integer pagoId,
        Integer adquisicionId,
        String estado,
        LocalDateTime fechaPago,
        BigDecimal importeTotal,
        String moneda,
        MedioDePagoRef medioDePago
) {
    public record MedioDePagoRef(Integer id, String tipo, String ultimosCuatroDigitos) {}
}
