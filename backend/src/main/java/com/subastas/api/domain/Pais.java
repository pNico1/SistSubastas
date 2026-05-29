package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "paises")
@Getter @Setter @NoArgsConstructor
public class Pais {

    @Id
    private Integer numero;

    private String nombre;
    private String nombreCorto;
    private String capital;
    private String nacionalidad;
    private String idiomas;
}
