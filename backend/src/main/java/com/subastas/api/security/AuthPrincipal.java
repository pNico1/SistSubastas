package com.subastas.api.security;

import java.util.List;

/**
 * Usuario autenticado que viaja en el SecurityContext.
 * clienteId es null si el usuario no es cliente (p. ej. empleado).
 */
public record AuthPrincipal(
        Integer usuarioId,
        Integer personaId,
        String email,
        Integer clienteId,
        List<String> roles
) {
    public boolean isCliente() {
        return clienteId != null && roles.contains("ROLE_CLIENTE");
    }

    public boolean isEmpleado() {
        return roles.contains("ROLE_EMPLEADO");
    }
}
