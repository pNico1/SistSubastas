package com.subastas.api.repository;

import com.subastas.api.domain.RegistroPendiente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RegistroPendienteRepository extends JpaRepository<RegistroPendiente, Integer> {
    Optional<RegistroPendiente> findByEmail(String email);
    long deleteByEmail(String email);
    long deleteByExpiraBefore(LocalDateTime momento);
}
