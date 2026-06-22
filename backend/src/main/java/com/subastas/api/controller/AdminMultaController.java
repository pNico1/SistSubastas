package com.subastas.api.controller;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Multa;
import com.subastas.api.repository.ClienteRepository;
import com.subastas.api.repository.MultaRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.service.NotificacionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Multas impuestas de oficio por la empresa (no-show, incumplimiento detectado
 * por la empresa, etc.). Hasta ahora la multa solo podia nacer cuando el propio
 * cliente declaraba falta de fondos (POST .../adquisiciones/{id}/sin-fondos);
 * la empresa no tenia forma de multar.
 *
 * No requiere tabla nueva: la tabla 'multas' (tabla de la app, no original) ya
 * admite 'adquisicion' NULL, asi que una multa de oficio sin adquisicion
 * asociada es valida tal cual el esquema.
 */
@RestController
@RequestMapping("/api/admin/multas")
public class AdminMultaController {

    private final MultaRepository multaRepo;
    private final ClienteRepository clienteRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final NotificacionService notificacionService;

    public AdminMultaController(MultaRepository multaRepo,
                               ClienteRepository clienteRepo,
                               RegistroDeSubastaRepository registroRepo,
                               NotificacionService notificacionService) {
        this.multaRepo = multaRepo;
        this.clienteRepo = clienteRepo;
        this.registroRepo = registroRepo;
        this.notificacionService = notificacionService;
    }

    /** Lista las multas. ?cliente= y ?estado= (pending/paid) opcionales. */
    @GetMapping
    public List<Multa> listar(@RequestParam(required = false) Integer cliente,
                              @RequestParam(required = false) String estado) {
        List<Multa> base = (cliente != null) ? multaRepo.findByCliente(cliente) : multaRepo.findAll();
        return base.stream()
                .filter(m -> estado == null || estado.equalsIgnoreCase(m.getEstado() == null ? "" : m.getEstado()))
                .toList();
    }

    /**
     * Impone una multa. body:
     *   cliente      (obligatorio) id del cliente multado
     *   importe      (obligatorio) > 0
     *   adquisicion  (opcional)    adquisicion asociada; si se pasa debe existir y ser de ese cliente
     *   fechaLimite  (opcional)    ISO yyyy-MM-dd; por defecto hoy + 3 dias
     *   motivo       (opcional)    texto para la notificacion
     */
    @PostMapping
    public ResponseEntity<Multa> crear(@RequestBody Map<String, Object> body) {
        Integer clienteId = integer(body, "cliente");
        if (clienteId == null) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "El cliente es obligatorio");
        }
        clienteRepo.findById(clienteId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CLIENTE_NOT_FOUND, "Cliente no encontrado"));

        BigDecimal importe = decimal(body, "importe");
        if (importe == null || importe.compareTo(BigDecimal.ZERO) <= 0) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "El importe debe ser mayor a 0");
        }

        Integer adquisicionId = integer(body, "adquisicion");
        if (adquisicionId != null) {
            var adq = registroRepo.findById(adquisicionId)
                    .orElseThrow(() -> ApiException.notFound(ErrorCodes.ADQUISICION_NOT_FOUND, "Adquisicion no encontrada"));
            if (!clienteId.equals(adq.getCliente())) {
                throw ApiException.conflict(ErrorCodes.CONFLICT, "La adquisicion no pertenece a ese cliente");
            }
        }

        Multa m = new Multa();
        m.setCliente(clienteId);
        m.setAdquisicion(adquisicionId);
        m.setImporte(importe);
        m.setEstado("pending");
        m.setFechaLimite(fechaLimite(body));
        m.setFecha(LocalDateTime.now());
        m = multaRepo.save(m);

        String motivo = str(body, "motivo");
        String mensaje = (motivo == null || motivo.isBlank())
                ? "La empresa te aplico una multa. Revisa el detalle y abonala antes de la fecha limite."
                : "La empresa te aplico una multa: " + motivo + ". Abonala antes de la fecha limite.";
        notificacionService.crearParaCliente(clienteId, "MULTA:" + m.getId(), mensaje);

        return ResponseEntity.status(HttpStatus.CREATED).body(m);
    }

    // ---- helpers ----

    private LocalDate fechaLimite(Map<String, Object> body) {
        String value = str(body, "fechaLimite");
        if (value == null || value.isBlank()) return LocalDate.now().plusDays(3);
        return LocalDate.parse(value);
    }

    private static String str(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private static Integer integer(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? null : Integer.valueOf(s);
    }

    private static BigDecimal decimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? null : new BigDecimal(s);
    }
}
