package com.subastas.api.dto;

import java.time.LocalDateTime;

/**
 * GET /api/subastas/{id}/item-activo
 * Le dice al front cual es el unico item que se puede pujar ahora y cuanto falta.
 */
public record ItemActivoDto(
        Integer subastaId,
        String estado,            // programada / abierta / cerrada
        Integer itemActivoId,     // null si esta en pausa entre items, programada o cerrada
        Long segundosRestantes,   // del item activo, por inactividad
        Integer ventanaSeg,       // duracion total de la ventana de inactividad (para la barra)
        LocalDateTime proximoArranca
) {}
