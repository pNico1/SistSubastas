package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "solicitudesAumentoSeguro")
@Getter @Setter @NoArgsConstructor
public class SolicitudAumentoSeguro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer producto;
    private BigDecimal nuevoValorAsegurado;
    private String estado;
    private LocalDateTime fecha;
}
