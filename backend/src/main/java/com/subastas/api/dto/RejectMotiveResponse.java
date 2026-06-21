package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RejectMotiveResponse(String motivo, LocalDateTime fecha, BigDecimal costoDevolucion, String moneda) {
}
