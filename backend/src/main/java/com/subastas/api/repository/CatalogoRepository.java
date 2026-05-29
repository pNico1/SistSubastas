package com.subastas.api.repository;

import com.subastas.api.domain.Catalogo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CatalogoRepository extends JpaRepository<Catalogo, Integer> {
    Optional<Catalogo> findBySubasta(Integer subasta);
}
