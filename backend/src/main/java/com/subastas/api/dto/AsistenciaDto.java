package com.subastas.api.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AsistenciaDto(Integer subastaId, Integer numeroPostor, LocalDate fecha, LocalTime hora,
                            String categoria, String moneda, String estado, String resultado) {}
