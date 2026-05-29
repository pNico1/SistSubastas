package com.subastas.api.dto;

public record AuthTokensResponse(
        String accessToken,
        String refreshToken,
        UsuarioDto usuario
) {}
