package com.subastas.api.repository;

import com.subastas.api.domain.PagoAumentoSeguro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PagoAumentoSeguroRepository extends JpaRepository<PagoAumentoSeguro, Integer> {
    Optional<PagoAumentoSeguro> findBySolicitud(Integer solicitud);
}
