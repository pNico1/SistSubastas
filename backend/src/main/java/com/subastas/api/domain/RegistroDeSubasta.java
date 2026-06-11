package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Adquisicion: registro de la venta de un producto a un cliente.
 * Tabla original 'registroDeSubasta' (no se puede modificar) + satelite
 * 'registroDeSubastaDatos' (estado y fecha del ciclo de pago/entrega).
 */
@Entity
@Table(name = "registroDeSubasta")
@SecondaryTable(name = "registroDeSubastaDatos",
        pkJoinColumns = @PrimaryKeyJoinColumn(name = "registro"))
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

    // --- satelite registroDeSubastaDatos ---
    @Column(table = "registroDeSubastaDatos")
    private String estado;        // pendiente / pagado / entregado / en_mora

    @Column(table = "registroDeSubastaDatos")
    private LocalDateTime fecha;
}
