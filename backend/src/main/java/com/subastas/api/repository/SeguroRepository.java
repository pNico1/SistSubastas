package com.subastas.api.repository;

import com.subastas.api.domain.Seguro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SeguroRepository extends JpaRepository<Seguro, String> {
}
