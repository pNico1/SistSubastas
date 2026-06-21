package com.subastas.api.repository;

import com.subastas.api.domain.Multa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MultaRepository extends JpaRepository<Multa, Integer> {
    List<Multa> findByCliente(Integer cliente);
    Optional<Multa> findByAdquisicion(Integer adquisicion);
}
