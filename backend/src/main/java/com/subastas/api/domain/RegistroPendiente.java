package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Registro de un postor que todavia NO verifico su email. Tabla nueva: no toca
 * ninguna tabla original. Mientras la cuenta no se verifica, NO existe persona/
 * usuario/cliente, asi que si el usuario abandona el registro no queda nada y
 * puede volver a registrarse con el mismo email/documento.
 *
 * El codigo se guarda en claro (es efimero, 15 min). La clave provisoria se
 * guarda HASHEADA: al verificar, ese mismo hash pasa tal cual a usuarios.
 */
@Entity
@Table(name = "registrosPendientes")
@Getter @Setter @NoArgsConstructor
public class RegistroPendiente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String email;
    private String documento;
    private String nombre;
    private String apellido;
    private String direccion;
    private Integer paisOrigen;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] fotoDocFrente;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] fotoDocDorso;

    private String passwordHash;   // hash de la clave provisoria (no el texto plano)
    private String codigo;         // codigo de verificacion de 6 digitos (en claro, efimero)
    private LocalDateTime expira;
    private LocalDateTime fechaCreacion;
}
