package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SolicitudSeguroAdminResponse(Integer solicitudId, Integer productoId, Integer duenioId,
        String nroPoliza, String compania, BigDecimal valorActual, BigDecimal nuevoValor,
        BigDecimal diferenciaPremio, String moneda, String estado, LocalDateTime fecha) {}
