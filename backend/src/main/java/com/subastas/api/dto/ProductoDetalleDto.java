package com.subastas.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ProductoDetalleDto(
        Integer id, Integer productoId, String descripcionCatalogo, String descripcionCompleta,
        String estado, String disponible, String nombreArtista, String fechaObra, String historia,
        String terminosAceptados, BigDecimal precioBase, BigDecimal comision, String moneda,
        Integer subastaId, LocalDate subastaFecha, LocalTime subastaHora, String deposito,
        PolizaDto poliza, OrigenDto origen, List<String> fotos
) {
    public record PolizaDto(String numero, String cobertura, BigDecimal valorAsegurado, String compania) {}
    public record OrigenDto(String estado, String detalle, String documentacion,
                            String alertaAutoridades, String motivoAlerta, Integer subastaColeccionId) {}
}
