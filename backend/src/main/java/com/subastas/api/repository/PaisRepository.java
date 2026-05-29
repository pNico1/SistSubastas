package com.subastas.api.repository;

import com.subastas.api.domain.Pais;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaisRepository extends JpaRepository<Pais, Integer> {
    List<Pais> findByNombreContainingIgnoreCase(String nombre);
}
