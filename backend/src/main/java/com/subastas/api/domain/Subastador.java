package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "subastadores")
@Getter @Setter @NoArgsConstructor
public class Subastador {

    @Id
    private Integer identificador;    // = personas.identificador

    private String matricula;
    private String region;
}
