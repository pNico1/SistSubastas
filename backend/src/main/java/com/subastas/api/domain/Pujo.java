package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tabla original 'pujos' (no se puede modificar) + satelite 'pujosDatos'
 * (timestamp para respetar el orden de las pujas).
 */
@Entity
@Table(name = "pujos")
@SecondaryTable(name = "pujosDatos",
        pkJoinColumns = @PrimaryKeyJoinColumn(name = "pujo"))
@Getter @Setter @NoArgsConstructor
public class Pujo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer identificador;

    private Integer asistente;
    private Integer item;
    private BigDecimal importe;
    private String ganador;       // si / no

    // --- satelite pujosDatos ---
    @Column(table = "pujosDatos")
    private LocalDateTime fechaHora;
}
