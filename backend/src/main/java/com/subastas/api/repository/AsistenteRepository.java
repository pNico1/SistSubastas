package com.subastas.api.repository;

import com.subastas.api.domain.Asistente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AsistenteRepository extends JpaRepository<Asistente, Integer> {
    Optional<Asistente> findByClienteAndSubasta(Integer cliente, Integer subasta);
    List<Asistente> findBySubasta(Integer subasta);
    List<Asistente> findByCliente(Integer cliente);
    Optional<Asistente> findTopBySubastaOrderByNumeroPostorDesc(Integer subasta);
}
