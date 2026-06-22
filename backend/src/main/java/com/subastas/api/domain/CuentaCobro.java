package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name = "cuentasCobroDuenio")
@Getter @Setter @NoArgsConstructor
public class CuentaCobro {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer duenio;
    private String titular;
    private String banco;
    private String identificadorBancario;
    private String moneda;
    private String pais;
    private String exterior;
    private String estado;
    private LocalDateTime fecha;
}
