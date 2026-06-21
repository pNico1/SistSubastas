package com.subastas.api.dto;

import java.math.BigDecimal;

public record SeguroProductoResponse(String numero, String cobertura, BigDecimal valorAsegurado,
                                     String moneda, BigDecimal premioActual, BigDecimal costoPorUnidad,
                                     String compania, String estadoSolicitud) {
}
