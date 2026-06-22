package com.subastas.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Alta de un bien para subastar ("ofrecer un bien").
 * Las fotos viajan como base64 (cada string es una imagen). Se acepta con o sin
 * el prefijo data URI (data:image/png;base64,...). El backend las decodifica.
 */
public record CreateProductoRequest(
        @NotBlank @Size(max = 500) String descripcionCatalogo,   // titulo / texto de catalogo
        @Size(max = 300) String descripcionCompleta,             // detalle largo o link (opcional)
        @Size(max = 200) String nombreArtista,
        @Size(max = 50) String fechaObra,
        @Size(max = 1000) String historia,
        @NotNull BigDecimal precioBase,
        @Size(max = 3) String moneda,
        Integer cantidad,
        @NotNull Boolean origenLicitoDeclarado,
        @NotBlank @Size(max = 1000) String detalleOrigen,
        @Size(max = 500) String documentacionOrigen,
        @NotNull Boolean terminosAceptados,
        @NotEmpty @Size(min = 6, max = 8) List<@NotBlank String> fotos // base64, entre 6 y 8
) {}
