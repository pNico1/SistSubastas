package com.subastas.api.dto;
import jakarta.validation.constraints.NotBlank;
public record CuentaCobroRequest(@NotBlank String titular, @NotBlank String banco,
        @NotBlank String identificadorBancario, @NotBlank String moneda,
        @NotBlank String pais, Boolean exterior) {}
