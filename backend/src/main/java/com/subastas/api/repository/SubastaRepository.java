package com.subastas.api.repository;

import com.subastas.api.domain.Subasta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubastaRepository extends JpaRepository<Subasta, Integer> {
    Page<Subasta> findByEstado(String estado, Pageable pageable);
    Page<Subasta> findByCategoria(String categoria, Pageable pageable);
    Page<Subasta> findByEstadoAndCategoria(String estado, String categoria, Pageable pageable);
}
