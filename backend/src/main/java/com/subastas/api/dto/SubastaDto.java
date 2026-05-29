package com.subastas.api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record SubastaDto(
        Integer id,
        LocalDate fecha,
        LocalTime hora,
        String estado,
        String categoria,
        String moneda,
        String ubicacion,
        Integer cantidadItems
) {}
