package com.subastas.api.repository;

import com.subastas.api.domain.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    List<Producto> findByDuenio(Integer duenio);
    List<Producto> findByDisponible(String disponible);
    List<Producto> findByDescripcionCatalogoContainingIgnoreCase(String texto);
}
