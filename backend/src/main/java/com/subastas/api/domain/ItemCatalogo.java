package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "itemsCatalogo")
@Getter @Setter @NoArgsConstructor
public class ItemCatalogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private Integer catalogo;
    private Integer producto;
    private BigDecimal precioBase;
    private BigDecimal comision;
    private String subastado;     // si / no
}
