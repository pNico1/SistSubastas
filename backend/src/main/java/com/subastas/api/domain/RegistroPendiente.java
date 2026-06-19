package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Registro de un postor que todavia NO verifico su email. Tabla nueva: no toca
 * ninguna tabla original. Mientras la cuenta no se verifica, NO existe persona/
 * usuario/cliente.
 *
 * Cada registracion es una fila propia identificada por un 'token' opaco (el
 * registrationId que se devuelve al front). La verificacion se ata a ESA fila,
 * no al email: si dos personas usan el mismo email, cada una solo puede
 * completar su propia registracion con el codigo que le corresponde, y no se
 * mezclan datos.
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

    private String token;          // registrationId opaco: identifica esta registracion

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
