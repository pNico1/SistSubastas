package com.subastas.api.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.subastas.api.repository.UsuarioRepository;

import java.io.IOException;
import java.util.List;

/** Lee el header Authorization: Bearer xxx, valida el access token y autentica. */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepo;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepo) {
        this.jwtService = jwtService;
        this.usuarioRepo = usuarioRepo;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtService.parse(token);
                if (jwtService.isAccessToken(claims)
                        && SecurityContextHolder.getContext().getAuthentication() == null) {
                    AuthPrincipal principal = jwtService.toPrincipal(claims);
                    boolean suspendido = usuarioRepo.findById(principal.usuarioId())
                            .map(u -> "suspended".equals(u.getEstadoRegistro()))
                            .orElse(true);
                    if (suspendido) {
                        SecurityContextHolder.clearContext();
                        chain.doFilter(request, response);
                        return;
                    }
                    List<SimpleGrantedAuthority> authorities = principal.roles().stream()
                            .map(SimpleGrantedAuthority::new)
                            .toList();
                    var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                // token invalido/expirado -> queda sin autenticar; el entry point devuelve 401
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
