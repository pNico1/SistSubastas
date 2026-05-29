package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "entregas")
@Getter @Setter @NoArgsConstructor
public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer adquisicion;
    private String tipo;             // envio / retiro
    private String estado;
    private String direccion;
    private String codigoRetiro;
    private String transportista;
    private String codigoSeguimiento;
    private LocalDate fechaEstimada;
}
