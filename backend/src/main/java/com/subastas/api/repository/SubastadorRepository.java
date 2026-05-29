package com.subastas.api.repository;

import com.subastas.api.domain.Subastador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubastadorRepository extends JpaRepository<Subastador, Integer> {
}
