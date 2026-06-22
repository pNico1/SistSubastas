package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagosAumentoSeguro")
@Getter @Setter @NoArgsConstructor
public class PagoAumentoSeguro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer solicitud;
    private BigDecimal importe;
    private String moneda;
    private String estado;
    private LocalDateTime fecha;
}
