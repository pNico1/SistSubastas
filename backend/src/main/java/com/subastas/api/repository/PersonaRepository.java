package com.subastas.api.repository;

import com.subastas.api.domain.Persona;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonaRepository extends JpaRepository<Persona, Integer> {
    boolean existsByDocumento(String documento);
}
