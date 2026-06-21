package com.subastas.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record UpgradeSeguroRequest(@NotNull @Positive BigDecimal nuevoValorAsegurado) {
}
