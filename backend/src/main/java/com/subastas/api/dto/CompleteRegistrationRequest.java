package com.subastas.api.dto;

import jakarta.validation.constraints.NotBlank;

public record CompleteRegistrationRequest(
        @NotBlank String password,
        @NotBlank String passwordConfirmation
) {}
