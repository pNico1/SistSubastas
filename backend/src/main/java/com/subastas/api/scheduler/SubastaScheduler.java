package com.subastas.api.scheduler;

import com.subastas.api.domain.Subasta;
import com.subastas.api.repository.SubastaRepository;
import com.subastas.api.service.SubastaTiempoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Empuja el motor temporal sin depender del trafico de usuarios: cada pocos
 * segundos materializa las subastas abiertas, de modo que los items se cierran
 * por inactividad, se registran las ventas y la subasta se cierra al terminar
 * el ultimo item, aunque nadie este mirando.
 */
@Component
public class SubastaScheduler {

    private static final Logger log = LoggerFactory.getLogger(SubastaScheduler.class);

    private final SubastaRepository subastaRepo;
    private final SubastaTiempoService tiempoService;

    public SubastaScheduler(SubastaRepository subastaRepo, SubastaTiempoService tiempoService) {
        this.subastaRepo = subastaRepo;
        this.tiempoService = tiempoService;
    }

    @Scheduled(fixedDelayString = "${app.subastas.scheduler-ms:10000}", initialDelayString = "10000")
    public void avanzarSubastas() {
        for (Subasta s : subastaRepo.findByEstado("abierta")) {
            try {
                tiempoService.materializar(s.getIdentificador());
            } catch (Exception e) {
                log.warn("No se pudo materializar la subasta {}: {}", s.getIdentificador(), e.getMessage());
            }
        }
    }
}
