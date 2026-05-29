package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "multas")
@Getter @Setter @NoArgsConstructor
public class Multa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer cliente;
    private Integer adquisicion;
    private BigDecimal importe;
    private String estado;        // pending / paid
    private LocalDate fechaLimite;
    private LocalDateTime fecha;
}
