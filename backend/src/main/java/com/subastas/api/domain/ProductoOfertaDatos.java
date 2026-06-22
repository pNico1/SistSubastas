package com.subastas.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "productoOfertaDatos")
@Getter @Setter @NoArgsConstructor
public class ProductoOfertaDatos {

    @Id
    private Integer producto;

    private BigDecimal precioBaseSugerido;
    private String moneda;
    private Integer cantidad;
    private String origenLicitoDeclarado; // si / no
    private String detalleOrigen;
    private String documentacionOrigen;
    private String estadoOrigen;          // declarado / validado / observado
    private String alertaAutoridades;     // si / no
    private String motivoAlerta;
    private LocalDateTime fechaAlerta;
    private Integer subastaColeccion;
}
