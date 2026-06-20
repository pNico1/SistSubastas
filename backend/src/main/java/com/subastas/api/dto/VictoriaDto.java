package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** GET /api/clientes/me/victorias — una pieza ganada por el cliente. */
public record VictoriaDto(
        Integer purchaseId,
        AuctionRef auction,
        ItemRef item,
        BigDecimal winningBid,
        BigDecimal commission,
        BigDecimal totalPaid,
        String paymentStatus    // pending / paid / defaulted
) {
    public record AuctionRef(Integer id, LocalDate fecha, String categoria, String moneda) {}
    public record ItemRef(Integer id, String descripcion, BigDecimal precioBase) {}
}
