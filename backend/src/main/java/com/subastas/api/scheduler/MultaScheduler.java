package com.subastas.api.scheduler;

import com.subastas.api.domain.Multa;
import com.subastas.api.domain.RegistroDeSubasta;
import com.subastas.api.repository.MultaRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.repository.UsuarioRepository;
import com.subastas.api.service.NotificacionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Genera la multa por mora: si una adquisicion queda pendiente de pago mas de
 * 72hs, se crea una multa del 10% del importe y la adquisicion pasa a 'en_mora'.
 * Es idempotente: no genera una segunda multa para la misma adquisicion.
 */
@Component
public class MultaScheduler {

    private static final Logger log = LoggerFactory.getLogger(MultaScheduler.class);
    private static final long HORAS_LIMITE = 72;
    private static final BigDecimal PORCENTAJE = new BigDecimal("0.10");

    private final RegistroDeSubastaRepository registroRepo;
    private final MultaRepository multaRepo;
    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepo;

    public MultaScheduler(RegistroDeSubastaRepository registroRepo, MultaRepository multaRepo,
                          NotificacionService notificacionService, UsuarioRepository usuarioRepo) {
        this.registroRepo = registroRepo;
        this.multaRepo = multaRepo;
        this.notificacionService = notificacionService;
        this.usuarioRepo = usuarioRepo;
    }

    @Scheduled(fixedDelayString = "${app.multas.scheduler-ms:60000}", initialDelayString = "30000")
    @Transactional
    public void generarMultasPorMora() {
        LocalDateTime limite = LocalDateTime.now().minusHours(HORAS_LIMITE);

        for (RegistroDeSubasta r : registroRepo.findByEstado("pendiente")) {
            if (r.getFecha() == null || r.getFecha().isAfter(limite)) continue;       // todavia dentro de las 72hs
            if (multaRepo.findByAdquisicion(r.getIdentificador()).isPresent()) continue; // ya tiene multa
            if (r.getImporte() == null) continue;

            Multa m = new Multa();
            m.setCliente(r.getCliente());
            m.setAdquisicion(r.getIdentificador());
            m.setImporte(r.getImporte().multiply(PORCENTAJE));
            m.setEstado("pending");
            m.setFechaLimite(LocalDate.now().plusDays(3));   // 72hs para presentar los fondos
            m.setFecha(LocalDateTime.now());
            m = multaRepo.save(m);

            r.setEstado("en_mora");
            registroRepo.save(r);

            notificacionService.crearParaCliente(r.getCliente(), "MULTA:" + m.getId(),
                    "Venció el plazo de pago. Se generó una multa del 10% de tu oferta; debés abonarla antes de participar nuevamente.");

            log.info("Multa por mora generada para adquisicion {} (cliente {})",
                    r.getIdentificador(), r.getCliente());
        }

        // Si tampoco presenta los fondos dentro de las 72 horas posteriores a
        // la multa, el caso sale del alcance de la app y la cuenta se suspende.
        for (RegistroDeSubasta r : registroRepo.findByEstado("en_mora")) {
            multaRepo.findByAdquisicion(r.getIdentificador()).ifPresent(m -> {
                if (!"pending".equals(m.getEstado()) || m.getFechaLimite() == null
                        || !m.getFechaLimite().isBefore(LocalDate.now())) return;
                usuarioRepo.findByPersona(r.getCliente()).ifPresent(usuario -> {
                    if (!"suspended".equals(usuario.getEstadoRegistro())) {
                        usuario.setEstadoRegistro("suspended");
                        usuarioRepo.save(usuario);
                        log.warn("Cuenta suspendida por incumplimiento de la adquisicion {}",
                                r.getIdentificador());
                    }
                });
            });
        }
    }
}
