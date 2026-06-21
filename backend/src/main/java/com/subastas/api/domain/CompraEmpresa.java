package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tabla nueva 'comprasEmpresa': pieza que, al cerrar su item sin pujas, compra
 * la empresa al precio base. No tiene cliente (queda fuera de registroDeSubasta).
 */
@Entity
@Table(name = "comprasEmpresa")
@Getter @Setter @NoArgsConstructor
public class CompraEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer subasta;
    private Integer producto;
    private Integer duenio;
    private BigDecimal precioBase;
    private BigDecimal comision;
    private LocalDateTime fecha;
}
