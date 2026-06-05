package com.subastas.api.repository;

import com.subastas.api.domain.RegistroDeSubasta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistroDeSubastaRepository extends JpaRepository<RegistroDeSubasta, Integer> {
    List<RegistroDeSubasta> findByCliente(Integer cliente);
    List<RegistroDeSubasta> findByClienteAndEstado(Integer cliente, String estado);
    List<RegistroDeSubasta> findBySubasta(Integer subasta);
}
