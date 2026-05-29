package com.subastas.api.dto;

import jakarta.validation.constraints.NotNull;

public record JoinRequest(@NotNull Integer subastaId) {}
