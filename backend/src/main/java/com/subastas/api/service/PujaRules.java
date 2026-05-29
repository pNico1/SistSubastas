package com.subastas.api.service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Reglas de negocio de las pujas (TP):
 *  - La puja debe ser al menos la mejor oferta + 1% del valor base.
 *  - La puja no puede superar la mejor oferta + 20% del valor base.
 *  - Estos limites NO aplican a subastas de categoria oro y platino
 *    (solo deben superar la oferta actual).
 */
public final class PujaRules {

    private PujaRules() {}

    private static final Map<String, Integer> RANK = Map.of(
            "comun", 1, "especial", 2, "plata", 3, "oro", 4, "platino", 5);

    public static boolean sinLimites(String categoria) {
        return "oro".equalsIgnoreCase(categoria) || "platino".equalsIgnoreCase(categoria);
    }

    /** true si un cliente de categoria propia puede acceder a una subasta de la categoria dada. */
    public static boolean puedeAcceder(String categoriaSubasta, String categoriaCliente) {
        int s = RANK.getOrDefault(categoriaSubasta == null ? "" : categoriaSubasta.toLowerCase(), 99);
        int c = RANK.getOrDefault(categoriaCliente == null ? "" : categoriaCliente.toLowerCase(), -1);
        return s <= c;
    }

    public record Limites(BigDecimal minima, BigDecimal maxima) {}

    /**
     * @param precioBase    valor base del bien
     * @param ofertaActual  mejor oferta vigente (null si nadie pujo)
     * @param categoria     categoria de la subasta
     */
    public static Limites calcular(BigDecimal precioBase, BigDecimal ofertaActual, String categoria) {
        BigDecimal base = (ofertaActual != null) ? ofertaActual : precioBase;
        if (sinLimites(categoria)) {
            // solo debe superar la oferta vigente; si no hay, al menos el precio base
            BigDecimal minima = (ofertaActual != null)
                    ? ofertaActual.add(new BigDecimal("0.01"))
                    : precioBase;
            return new Limites(minima, null);
        }
        BigDecimal unoPorCiento = precioBase.multiply(new BigDecimal("0.01"));
        BigDecimal veintePorCiento = precioBase.multiply(new BigDecimal("0.20"));
        return new Limites(base.add(unoPorCiento), base.add(veintePorCiento));
    }
}
