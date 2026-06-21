package com.subastas.api.repository;

import com.subastas.api.domain.SolicitudAumentoSeguro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SolicitudAumentoSeguroRepository extends JpaRepository<SolicitudAumentoSeguro, Integer> {
    Optional<SolicitudAumentoSeguro> findFirstByProductoAndEstadoOrderByFechaDesc(Integer producto, String estado);
}
