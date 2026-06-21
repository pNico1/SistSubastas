package com.subastas.api.repository;

import com.subastas.api.domain.CompraEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompraEmpresaRepository extends JpaRepository<CompraEmpresa, Integer> {
    Optional<CompraEmpresa> findBySubastaAndProducto(Integer subasta, Integer producto);
    List<CompraEmpresa> findBySubasta(Integer subasta);
}
