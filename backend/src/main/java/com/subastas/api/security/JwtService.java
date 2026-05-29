package com.subastas.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Genera y valida JWT (access y refresh). */
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessMinutes;
    private final long refreshDays;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-minutes:30}") long accessMinutes,
            @Value("${app.jwt.refresh-token-days:7}") long refreshDays) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
    }

    public String generateAccessToken(AuthPrincipal p) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + accessMinutes * 60_000L);
        return Jwts.builder()
                .subject(p.email())
                .claim("uid", p.usuarioId())
                .claim("pid", p.personaId())
                .claim("cid", p.clienteId())
                .claim("roles", p.roles())
                .claim("typ", "access")
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(AuthPrincipal p) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + refreshDays * 86_400_000L);
        return Jwts.builder()
                .subject(p.email())
                .claim("uid", p.usuarioId())
                .claim("typ", "refresh")
                .id(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    /** Devuelve los claims si el token es valido; lanza excepcion si no. */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @SuppressWarnings("unchecked")
    public AuthPrincipal toPrincipal(Claims c) {
        Integer cid = c.get("cid", Integer.class);
        List<String> roles = (List<String>) c.getOrDefault("roles", List.of());
        return new AuthPrincipal(
                c.get("uid", Integer.class),
                c.get("pid", Integer.class),
                c.getSubject(),
                cid,
                roles
        );
    }

    public boolean isAccessToken(Claims c) {
        return "access".equals(c.get("typ", String.class));
    }

    public boolean isRefreshToken(Claims c) {
        return "refresh".equals(c.get("typ", String.class));
    }
}
