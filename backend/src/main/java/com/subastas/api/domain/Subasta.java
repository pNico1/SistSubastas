package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "subastas")
@Getter @Setter @NoArgsConstructor
public class Subasta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private LocalDate fecha;
    private LocalTime hora;
    private String estado;            // abierta / cerrada / programada
    private Integer subastador;
    private String ubicacion;
    private Integer capacidadAsistentes;
    private String tieneDeposito;     // si / no
    private String seguridadPropia;   // si / no
    private String categoria;
    private String moneda;            // ARS / USD
}
