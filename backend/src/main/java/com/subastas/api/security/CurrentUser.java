package com.subastas.api.security;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Helper para obtener el usuario autenticado actual desde cualquier servicio/controller. */
public final class CurrentUser {

    private CurrentUser() {}

    public static AuthPrincipal get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthPrincipal p)) {
            throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED,
                    ErrorCodes.UNAUTHORIZED, "No autenticado");
        }
        return p;
    }

    /** Igual que get() pero exige que el usuario sea cliente. */
    public static AuthPrincipal requireCliente() {
        AuthPrincipal p = get();
        if (!p.isCliente()) {
            throw ApiException.forbidden(ErrorCodes.NOT_CLIENT, "Se requiere un usuario cliente");
        }
        return p;
    }
}
