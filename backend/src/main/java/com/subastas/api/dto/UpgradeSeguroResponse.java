package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UpgradeSeguroResponse(Integer solicitudId, Integer productoId, BigDecimal nuevoValorAsegurado,
                                    String estado, LocalDateTime fecha) {
}
