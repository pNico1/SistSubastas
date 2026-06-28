package com.subastas.api.repository;

import com.subastas.api.domain.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Integer> {
    Optional<Pago> findByAdquisicion(Integer adquisicion);
    Optional<Pago> findByMulta(Integer multa);
    List<Pago> findByMedioPago(Integer medioPago);
}
