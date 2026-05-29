package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pujos")
@Getter @Setter @NoArgsConstructor
public class Pujo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private Integer asistente;
    private Integer item;
    private BigDecimal importe;
    private String ganador;       // si / no
    private LocalDateTime fechaHora;
}
