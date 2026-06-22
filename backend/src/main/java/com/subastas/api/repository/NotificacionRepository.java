package com.subastas.api.repository;

import com.subastas.api.domain.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Integer> {
    List<Notificacion> findByClienteOrderByFechaDesc(Integer cliente);
    boolean existsByClienteAndTipo(Integer cliente, String tipo);
}
