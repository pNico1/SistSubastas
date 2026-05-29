package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "seguros")
@Getter @Setter @NoArgsConstructor
public class Seguro {

    @Id
    private String nroPoliza;

    private String compania;
    private String polizaCombinada;   // si / no
    private BigDecimal importe;
}
