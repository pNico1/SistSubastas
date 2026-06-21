package com.subastas.api.dto;

public record DuenioUpdateRequest(Integer numeroPais, String verificacionFinanciera,
                                  String verificacionJudicial, Integer calificacionRiesgo, Integer verificador) {
}
