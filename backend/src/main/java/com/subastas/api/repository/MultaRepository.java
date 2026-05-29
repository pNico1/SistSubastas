package com.subastas.api.repository;

import com.subastas.api.domain.Multa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MultaRepository extends JpaRepository<Multa, Integer> {
    List<Multa> findByCliente(Integer cliente);
}
