package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fotos")
@Getter @Setter @NoArgsConstructor
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private Integer producto;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] foto;

    private String url;
    private Integer orden;
}
