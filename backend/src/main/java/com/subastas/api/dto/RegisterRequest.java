package com.subastas.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank String documento,
        String domicilio,
        @NotNull Integer paisOrigenId,
        @NotBlank @Email String email,
        // Fotos del documento en base64 (opcionales: el usuario puede subirlas
        // mas tarde con "Lo hare mas tarde").
        String fotoDocFrente,
        String fotoDocDorso
) {}
