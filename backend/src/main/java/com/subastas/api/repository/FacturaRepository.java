package com.subastas.api.repository;

import com.subastas.api.domain.Factura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FacturaRepository extends JpaRepository<Factura, Integer> {
    Optional<Factura> findByAdquisicion(Integer adquisicion);
}
