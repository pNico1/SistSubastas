package com.subastas.api.repository;

import com.subastas.api.domain.Pujo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PujoRepository extends JpaRepository<Pujo, Integer> {
    // oferta actual (la mas alta) sobre un item
    Optional<Pujo> findTopByItemOrderByImporteDesc(Integer item);
    // historial de pujas de un item, en orden cronologico
    List<Pujo> findByItemOrderByFechaHoraAsc(Integer item);
    // pujas hechas por un conjunto de asistencias (las del cliente)
    List<Pujo> findByAsistenteIn(List<Integer> asistentes);
    List<Pujo> findByAsistenteInAndGanador(List<Integer> asistentes, String ganador);
    List<Pujo> findByAsistenteInAndItem(List<Integer> asistentes, Integer item);
}
