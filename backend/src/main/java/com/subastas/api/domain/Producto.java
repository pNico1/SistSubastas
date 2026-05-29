package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "productos")
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
    private String estado;                // en_revision / aprobado / rechazado / aceptado / en_subasta / vendido / devuelto
    private String nombreArtista;
    private String fechaObra;
    private String historia;
    private String terminosAceptados;     // si / no
}
