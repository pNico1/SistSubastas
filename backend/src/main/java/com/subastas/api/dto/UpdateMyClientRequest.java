package com.subastas.api.dto;

import jakarta.validation.constraints.Size;

public record UpdateMyClientRequest(
        @Size(max = 100) String nombre,
        @Size(max = 100) String apellido,
        @Size(max = 350) String direccion,
        Integer paisId
) {}
