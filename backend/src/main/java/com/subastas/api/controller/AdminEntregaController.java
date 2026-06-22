package com.subastas.api.controller;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Entrega;
import com.subastas.api.domain.RegistroDeSubasta;
import com.subastas.api.repository.EntregaRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.service.NotificacionService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Gestion de entregas del lado empresa. El comprador elige envio o retiro y
 * confirma la recepcion, pero faltaba la palanca intermedia: que la empresa
 * despache el envio (pendiente -> en_camino) o deje la pieza lista para retiro.
 * Sin esto el circuito de entrega no se podia recorrer de punta a punta.
 *
 * No toca tablas originales: 'entregas' es una tabla de la app y su columna
 * 'estado' no tiene CHECK, por lo que admite los estados intermedios.
 */
@RestController
@RequestMapping("/api/admin/entregas")
public class AdminEntregaController {

    private final EntregaRepository entregaRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final NotificacionService notificacionService;

    public AdminEntregaController(EntregaRepository entregaRepo,
                                 RegistroDeSubastaRepository registroRepo,
                                 NotificacionService notificacionService) {
        this.entregaRepo = entregaRepo;
        this.registroRepo = registroRepo;
        this.notificacionService = notificacionService;
    }

    /** Lista entregas. ?estado= y ?tipo= (envio/retiro) opcionales. */
    @GetMapping
    public List<Entrega> listar(@RequestParam(required = false) String estado,
                                @RequestParam(required = false) String tipo) {
        return entregaRepo.findAll().stream()
                .filter(e -> estado == null || estado.equalsIgnoreCase(nullToEmpty(e.getEstado())))
                .filter(e -> tipo == null || tipo.equalsIgnoreCase(nullToEmpty(e.getTipo())))
                .toList();
    }

    @GetMapping("/{id}")
    public Entrega getById(@PathVariable Integer id) {
        return requireEntrega(id);
    }

    /**
     * La empresa despacha la entrega. Para 'envio' la pasa a 'en_camino' (y
     * permite setear transportista, codigoSeguimiento y fechaEstimada); para
     * 'retiro' la deja 'listo_para_retiro'. El comprador luego confirma la
     * recepcion con POST .../adquisiciones/{id}/confirmar.
     * body (opcional): transportista, codigoSeguimiento, fechaEstimada (yyyy-MM-dd)
     */
    @PutMapping("/{id}/despachar")
    public Entrega despachar(@PathVariable Integer id, @RequestBody(required = false) Map<String, Object> body) {
        Entrega e = requireEntrega(id);
        if ("confirmada".equals(e.getEstado())) {
            throw ApiException.conflict(ErrorCodes.DELIVERY_NOT_CONFIRMABLE,
                    "La entrega ya fue confirmada por el comprador");
        }
        Map<String, Object> safe = body == null ? Map.of() : body;

        if ("retiro".equals(e.getTipo())) {
            e.setEstado("listo_para_retiro");
        } else {
            e.setEstado("en_camino");
            if (safe.containsKey("transportista")) e.setTransportista(str(safe, "transportista"));
            if (safe.containsKey("codigoSeguimiento")) e.setCodigoSeguimiento(str(safe, "codigoSeguimiento"));
        }
        String fecha = str(safe, "fechaEstimada");
        if (fecha != null && !fecha.isBlank()) e.setFechaEstimada(LocalDate.parse(fecha));
        entregaRepo.save(e);

        notificarComprador(e);
        return e;
    }

    // ---- helpers ----

    private void notificarComprador(Entrega e) {
        RegistroDeSubasta r = registroRepo.findById(e.getAdquisicion()).orElse(null);
        if (r == null || r.getCliente() == null) return;
        String mensaje = "retiro".equals(e.getTipo())
                ? "Tu pieza esta lista para retirar en el deposito. Presenta tu codigo de retiro."
                : "Tu envio fue despachado y esta en camino. Confirma la recepcion cuando lo recibas.";
        notificacionService.crearParaCliente(r.getCliente(), "ENTREGA_DESPACHADA:" + e.getId(), mensaje);
    }

    private Entrega requireEntrega(Integer id) {
        return entregaRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ENTREGA_NOT_FOUND, "Entrega no encontrada"));
    }

    private static String str(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
