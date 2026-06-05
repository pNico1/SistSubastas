package com.subastas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter @Setter @NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer persona;          // FK -> personas.identificador
    private String email;
    private String passwordHash;
    private String estadoRegistro;    // pending_verification / approved / registration_incomplete / active / suspended
    private String emailVerificado;   // si / no -> el usuario confirmo el codigo enviado por mail
    private LocalDateTime fechaCreacion;
}
