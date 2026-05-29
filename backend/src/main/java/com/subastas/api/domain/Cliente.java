package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "clientes")
@Getter @Setter @NoArgsConstructor
public class Cliente {

    @Id
    private Integer identificador;    // = personas.identificador

    private Integer numeroPais;
    private String admitido;          // si / no
    private String categoria;         // comun / especial / plata / oro / platino
    private Integer verificador;      // FK -> empleados.identificador
}
