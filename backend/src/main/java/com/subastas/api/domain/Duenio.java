package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tabla original 'duenios': las columnas de verificacion llevan acento en la
 * base (tal cual EstructuraActual.sql), por eso el @Column con name explicito.
 * El fuente se compila como UTF-8 (default del parent de Spring Boot).
 */
@Entity
@Table(name = "duenios")
@Getter @Setter @NoArgsConstructor
public class Duenio {

    @Id
    private Integer identificador;    // = personas.identificador

    private Integer numeroPais;

    @Column(name = "verificaciónFinanciera")
    private String verificacionFinanciera;   // si / no

    @Column(name = "verificaciónJudicial")
    private String verificacionJudicial;     // si / no

    private Integer calificacionRiesgo;       // 1..6
    private Integer verificador;
}
