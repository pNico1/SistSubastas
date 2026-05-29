package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "mediosPago")
@Getter @Setter @NoArgsConstructor
public class MedioPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer cliente;
    private String tipo;             // tarjeta / cuenta_bancaria / cheque
    private String marca;
    private String banco;
    private String ultimos4;
    private String cbu;
    private String titular;
    private String moneda;           // ARS / USD
    private String esInternacional;  // si / no
    private BigDecimal montoGarantia;
    private String estado;           // pending / verified / rejected
    private LocalDateTime fechaCreacion;
}
