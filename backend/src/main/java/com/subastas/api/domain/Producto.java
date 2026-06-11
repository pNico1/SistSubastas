package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Tabla original 'productos' (no se puede modificar) + satelite 'productosDatos'
 * con el ciclo de revision/aceptacion y los datos de obras de arte.
 */
@Entity
@Table(name = "productos")
@SecondaryTable(name = "productosDatos",
        pkJoinColumns = @PrimaryKeyJoinColumn(name = "producto"))
@Getter @Setter @NoArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private LocalDate fecha;
    private String disponible;            // si / no
    private String descripcionCatalogo;
    private String descripcionCompleta;   // url pdf
    private Integer revisor;
    private Integer duenio;
    private String seguro;                // nroPoliza

    // --- satelite productosDatos ---
    @Column(table = "productosDatos")
    private String estado;                // en_revision / aprobado / rechazado / aceptado / en_subasta / vendido / devuelto

    @Column(table = "productosDatos")
    private String nombreArtista;

    @Column(table = "productosDatos")
    private String fechaObra;

    @Column(table = "productosDatos")
    private String historia;

    @Column(table = "productosDatos")
    private String terminosAceptados;     // si / no
}
