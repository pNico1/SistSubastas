package com.subastas.api.repository;

import com.subastas.api.domain.ProductoOfertaDatos;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductoOfertaDatosRepository extends JpaRepository<ProductoOfertaDatos, Integer> {
    Optional<ProductoOfertaDatos> findByProducto(Integer producto);
}
