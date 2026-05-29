package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "revisiones")
@Getter @Setter @NoArgsConstructor
public class Revision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer producto;
    private Integer revisor;
    private String estado;        // pendiente / aprobado / rechazado
    private String observaciones;
    private String motivo;
    private LocalDateTime fecha;
}
