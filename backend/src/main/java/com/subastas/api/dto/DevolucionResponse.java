package com.subastas.api.dto;

import java.math.BigDecimal;

public record DevolucionResponse(String estadoEnvio, String transportista, String codigoSeguimiento,
                                 BigDecimal costoEnvio, String moneda, String direccion) {
}
