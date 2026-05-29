package com.subastas.api.repository;

import com.subastas.api.domain.Foto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FotoRepository extends JpaRepository<Foto, Integer> {
    List<Foto> findByProductoOrderByOrden(Integer producto);
}
