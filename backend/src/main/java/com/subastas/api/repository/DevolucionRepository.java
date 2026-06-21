package com.subastas.api.repository;

import com.subastas.api.domain.Devolucion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DevolucionRepository extends JpaRepository<Devolucion, Integer> {
}
