package com.subastas.api.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Cuerpo estandar de error que devuelve la API.
 * { "code": "PUJA_TOO_LOW", "message": "...", "timestamp": "...", "fields": {...} }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        String code,
        String message,
        OffsetDateTime timestamp,
        Map<String, String> fields
) {
    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(code, message, OffsetDateTime.now(), null);
    }

    public static ApiErrorResponse of(String code, String message, Map<String, String> fields) {
        return new ApiErrorResponse(code, message, OffsetDateTime.now(), fields);
    }
}
