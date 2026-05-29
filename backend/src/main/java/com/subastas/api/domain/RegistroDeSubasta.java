package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Adquisicion: registro de la venta de un producto a un cliente. */
@Entity
@Table(name = "registroDeSubasta")
@Getter @Setter @NoArgsConstructor
public class RegistroDeSubasta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private Integer subasta;
    private Integer duenio;
    private Integer producto;
    private Integer cliente;
    private BigDecimal importe;
    private BigDecimal comision;
    private String estado;        // pendiente / pagado / entregado / en_mora
    private LocalDateTime fecha;
}
