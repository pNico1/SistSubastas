package com.subastas.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class SubastasApiApplication {
    public static void main(String[] args) {
        // Todo el backend opera en UTC: asi LocalDateTime.now() coincide con lo que
        // la base guarda (UTC) y el motor temporal compara relojes en la misma zona.
        // El front se encarga de mostrar las fechas en la zona horaria del usuario.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(SubastasApiApplication.class, args);
    }
}
