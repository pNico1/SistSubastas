package com.subastas.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PujaRulesTest {

    @Test
    void oroNoTieneTopeMaximo() {
        PujaRules.Limites limites = PujaRules.calcular(
                new BigDecimal("10000"),
                new BigDecimal("15000"),
                "oro");

        assertThat(limites.minima()).isEqualByComparingTo("15000.01");
        assertThat(limites.maxima()).isNull();
    }

    @Test
    void platinoNoTieneTopeMaximoAunqueVengaConEspaciosOMayusculas() {
        PujaRules.Limites limites = PujaRules.calcular(
                new BigDecimal("10000"),
                new BigDecimal("15000"),
                " PLATINO ");

        assertThat(limites.minima()).isEqualByComparingTo("15000.01");
        assertThat(limites.maxima()).isNull();
    }

    @Test
    void plataAplicaUnoPorCientoYVeintePorCientoSobrePrecioBase() {
        PujaRules.Limites limites = PujaRules.calcular(
                new BigDecimal("10000"),
                new BigDecimal("15000"),
                "plata");

        assertThat(limites.minima()).isEqualByComparingTo("15100");
        assertThat(limites.maxima()).isEqualByComparingTo("17000");
    }
}
