package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tabla original 'fotos' (no se puede modificar) + satelite 'fotosDatos'
 * (url y orden, que devuelven los endpoints).
 */
@Entity
@Table(name = "fotos")
@SecondaryTable(name = "fotosDatos",
        pkJoinColumns = @PrimaryKeyJoinColumn(name = "foto"))
@Getter @Setter @NoArgsConstructor
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private Integer producto;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] foto;

    // --- satelite fotosDatos ---
    @Column(table = "fotosDatos")
    private String url;

    @Column(table = "fotosDatos")
    private Integer orden;
}
