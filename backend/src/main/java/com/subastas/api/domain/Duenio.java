package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "duenios")
@Getter @Setter @NoArgsConstructor
public class Duenio {

    @Id
    private Integer identificador;    // = personas.identificador

    private Integer numeroPais;
    private String verificacionFinanciera;   // si / no
    private String verificacionJudicial;     // si / no
    private Integer calificacionRiesgo;       // 1..6
    private Integer verificador;
}
