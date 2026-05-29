package com.subastas.api.repository;

import com.subastas.api.domain.MedioPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedioPagoRepository extends JpaRepository<MedioPago, Integer> {
    List<MedioPago> findByCliente(Integer cliente);
    boolean existsByClienteAndEstado(Integer cliente, String estado);
}
