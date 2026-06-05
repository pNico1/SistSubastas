package com.subastas.api.repository;

import com.subastas.api.domain.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Integer> {
    List<ItemCatalogo> findByCatalogo(Integer catalogo);
    Optional<ItemCatalogo> findByCatalogoAndProducto(Integer catalogo, Integer producto);
}
