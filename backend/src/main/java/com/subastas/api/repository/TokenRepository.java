package com.subastas.api.repository;

import com.subastas.api.domain.Token;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenRepository extends JpaRepository<Token, Integer> {
    Optional<Token> findByValorAndTipo(String valor, String tipo);
    long deleteByUsuarioAndTipo(Integer usuario, String tipo);
}
