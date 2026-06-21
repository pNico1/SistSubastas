package com.subastas.api.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "devoluciones")
@Getter @Setter @NoArgsConstructor
public class Devolucion {
    @Id
    private Integer producto;
    private String estadoEnvio;
    private String transportista;
    private String codigoSeguimiento;
    private BigDecimal costoEnvio;
    private String moneda;
    private String direccion;
}
