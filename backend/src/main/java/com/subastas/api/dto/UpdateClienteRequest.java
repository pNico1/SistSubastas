package com.subastas.api.dto;

/**
 * Body de PUT /api/clientes/me. Ambos campos son opcionales:
 * - numeroPais: el cliente puede actualizar su pais.
 * - categoria: la asigna la empresa; si el cliente intenta cambiarla a un valor
 *   distinto del actual se responde 409 CATEGORY_CHANGE_NOT_ALLOWED.
 */
public record UpdateClienteRequest(
        Integer numeroPais,
        String categoria
) {}
