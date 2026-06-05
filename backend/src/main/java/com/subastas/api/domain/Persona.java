package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "personas")
@Getter @Setter @NoArgsConstructor
public class Persona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private String documento;
    private String nombre;
    private String apellido;
    private String direccion;
    private String estado;   // activo / inactivo

    // Fotos del documento (frente/dorso) cargadas en el registro. Opcionales.
    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] fotoDocFrente;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] fotoDocDorso;
}
