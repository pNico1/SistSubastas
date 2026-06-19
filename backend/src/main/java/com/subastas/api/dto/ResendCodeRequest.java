package com.subastas.api.dto;

import jakarta.validation.constraints.NotBlank;

public record ResendCodeRequest(
        @NotBlank String registrationId
) {}
