package com.subastas.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank String codigo,
        @NotBlank String password,
        @NotBlank String passwordConfirmation
) {}
