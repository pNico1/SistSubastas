package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tabla original 'personas' (no se puede modificar) + satelite 'personasDatos'
 * con los datos que necesita la app (apellido, fotos del documento).
 */
@Entity
@Table(name = "personas")
@SecondaryTable(name = "personasDatos",
        pkJoinColumns = @PrimaryKeyJoinColumn(name = "persona"))
@Getter @Setter @NoArgsConstructor
public class Persona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private String documento;
    private String nombre;
    private String direccion;
    private String estado;   // activo / incativo (typo literal del CHECK original)

    // --- satelite personasDatos ---
    @Column(table = "personasDatos")
    private String apellido;

    // Fotos del documento (frente/dorso) cargadas en el registro. Opcionales.
    @Lob
    @Column(table = "personasDatos", columnDefinition = "LONGBLOB")
    private byte[] fotoDocFrente;

    @Lob
    @Column(table = "personasDatos", columnDefinition = "LONGBLOB")
    private byte[] fotoDocDorso;
}
