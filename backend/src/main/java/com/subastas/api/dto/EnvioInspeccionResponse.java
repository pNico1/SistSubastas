package com.subastas.api.dto;

public record EnvioInspeccionResponse(Integer productoId, String producto, String direccion,
                                      String indicaciones, String condicionDevolucion) {}
