package com.subastas.api.repository;

import com.subastas.api.domain.Duenio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DuenioRepository extends JpaRepository<Duenio, Integer> {
}
