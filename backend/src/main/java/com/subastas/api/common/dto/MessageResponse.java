package com.subastas.api.common.dto;

/** Respuesta simple con un mensaje, usada por varios endpoints del TP. */
public record MessageResponse(String mensaje) {
    public static MessageResponse of(String mensaje) {
        return new MessageResponse(mensaje);
    }
}
