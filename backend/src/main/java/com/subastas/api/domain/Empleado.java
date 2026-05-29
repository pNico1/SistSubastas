package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "empleados")
@Getter @Setter @NoArgsConstructor
public class Empleado {

    @Id
    private Integer identificador;    // = personas.identificador (no autogenerado)

    private String cargo;
    private Integer sector;           // FK -> sectores.identificador
}
