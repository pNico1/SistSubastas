package com.subastas.api.repository;

import com.subastas.api.domain.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EntregaRepository extends JpaRepository<Entrega, Integer> {
    Optional<Entrega> findByAdquisicion(Integer adquisicion);
}
