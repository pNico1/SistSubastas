package com.subastas.api.dto;

import jakarta.validation.constraints.NotNull;

public record TerminosRequest(@NotNull Boolean aceptados) {
}
