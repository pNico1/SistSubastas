package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tabla nueva 'pagos': registra el pago de una adquisicion o de una multa.
 * 'adquisicion' y 'multa' son excluyentes (uno de los dos viene en null).
 */
@Entity
@Table(name = "pagos")
@Getter @Setter @NoArgsConstructor
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer adquisicion;    // FK -> registroDeSubasta (nullable)
    private Integer multa;          // FK -> multas (nullable)
    private Integer medioPago;      // FK -> mediosPago
    private BigDecimal importeTotal;
    private String moneda;          // ARS / USD
    private String estado;          // pagado
    private LocalDateTime fechaPago;
}
