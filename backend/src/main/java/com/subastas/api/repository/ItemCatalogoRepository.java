package com.subastas.api.repository;

import com.subastas.api.domain.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Integer> {
    List<ItemCatalogo> findByCatalogo(Integer catalogo);
}
