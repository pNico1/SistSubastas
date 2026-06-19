package com.subastas.api.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(
        @NotBlank String registrationId,
        @NotBlank String codigo
) {}
