package com.subastas.api.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreatePujaRequest(
        @NotNull BigDecimal importe
) {}
