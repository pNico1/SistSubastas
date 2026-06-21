package com.subastas.api.repository;

import com.subastas.api.domain.Revision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RevisionRepository extends JpaRepository<Revision, Integer> {
    List<Revision> findByEstado(String estado);
    List<Revision> findByProducto(Integer producto);
    java.util.Optional<Revision> findFirstByProductoAndEstadoOrderByFechaDesc(Integer producto, String estado);
}
