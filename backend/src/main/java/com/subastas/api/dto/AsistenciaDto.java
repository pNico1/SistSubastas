package com.subastas.api.dto;

import java.time.LocalDate;

/** Una asistencia del cliente a una subasta. GET /api/clientes/me/asistencias */
public record AsistenciaDto(
        Integer asistenciaId,
        SubastaRef subasta,
        Integer numeroPostor
) {
    public record SubastaRef(Integer id, LocalDate fecha, String estado) {}
}
