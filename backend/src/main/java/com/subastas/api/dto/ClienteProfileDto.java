package com.subastas.api.dto;

public record ClienteProfileDto(
        Integer id,
        String nombre,
        String apellido,
        String categoria,
        String admitido,
        PaisRef pais,
        String direccion
) {
    public record PaisRef(Integer id, String nombre) {}
}
