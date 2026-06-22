package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "liquidacionesVenta")
@Getter @Setter @NoArgsConstructor
public class LiquidacionVenta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer producto;
    private Integer duenio;
    private Integer adquisicion;
    private Integer compraEmpresa;
    private Integer cuentaCobro;
    private BigDecimal importeBruto;
    private BigDecimal comision;
    private BigDecimal importeNeto;
    private String moneda;
    private String estado;
    private LocalDateTime fechaGenerada;
    private LocalDateTime fechaTransferencia;
}
