package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "facturas")
@Getter @Setter @NoArgsConstructor
public class Factura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer adquisicion;
    private String numeroFactura;
    private BigDecimal importe;
    private BigDecimal comision;
    private BigDecimal costoEnvio;
    private BigDecimal total;
    private LocalDateTime fecha;
}
