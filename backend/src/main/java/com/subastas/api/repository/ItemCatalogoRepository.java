package com.subastas.api.repository;

import com.subastas.api.domain.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Integer> {
    List<ItemCatalogo> findByCatalogo(Integer catalogo);
    Optional<ItemCatalogo> findByCatalogoAndProducto(Integer catalogo, Integer producto);
    // usado por metricas (area 3) para el precioBase de una pieza ganada
    Optional<ItemCatalogo> findFirstByProducto(Integer producto);
}
