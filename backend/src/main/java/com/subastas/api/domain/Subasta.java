package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Tabla original 'subastas' (no se puede modificar) + satelite 'subastasDatos'
 * (moneda). El CHECK original de estado solo admite 'abierta'/'carrada' (typo
 * literal del archivo); NULL = subasta aun no abierta (programada).
 */
@Entity
@Table(name = "subastas")
@SecondaryTable(name = "subastasDatos",
        pkJoinColumns = @PrimaryKeyJoinColumn(name = "subasta"))
@Getter @Setter @NoArgsConstructor
public class Subasta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private LocalDate fecha;
    private LocalTime hora;
    private String estado;            // abierta / carrada / NULL (aun no abierta)
    private Integer subastador;
    private String ubicacion;
    private Integer capacidadAsistentes;
    private String tieneDeposito;     // si / no
    private String seguridadPropia;   // si / no
    private String categoria;

    // --- satelite subastasDatos ---
    @Column(table = "subastasDatos")
    private String moneda;            // ARS / USD
}
