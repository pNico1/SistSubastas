package com.subastas.api.repository;

import com.subastas.api.domain.RegistroPendiente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RegistroPendienteRepository extends JpaRepository<RegistroPendiente, Integer> {
    Optional<RegistroPendiente> findByToken(String token);
    long deleteByEmail(String email);
    long deleteByExpiraBefore(LocalDateTime momento);
}
