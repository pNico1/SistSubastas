package com.subastas.api.dto;

public record UsuarioDto(
        Integer id,
        String categoria,   // null si no es cliente
        String estado
) {}
