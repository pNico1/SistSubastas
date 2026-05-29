package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.*;
import com.subastas.api.dto.*;
import com.subastas.api.repository.*;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PujaService {

    private final SubastaService subastaService;
    private final ClienteRepository clienteRepo;
    private final AsistenteRepository asistenteRepo;
    private final PujoRepository pujoRepo;
    private final MedioPagoRepository medioPagoRepo;
    private final ItemCatalogoRepository itemRepo;
    private final CatalogoRepository catalogoRepo;
    private final ProductoRepository productoRepo;
    private final SubastaRepository subastaRepo;
    private final NotificacionRepository notificacionRepo;

    public PujaService(SubastaService subastaService, ClienteRepository clienteRepo,
                       AsistenteRepository asistenteRepo, PujoRepository pujoRepo,
                       MedioPagoRepository medioPagoRepo, ItemCatalogoRepository itemRepo,
                       CatalogoRepository catalogoRepo, ProductoRepository productoRepo,
                       SubastaRepository subastaRepo, NotificacionRepository notificacionRepo) {
        this.subastaService = subastaService;
        this.clienteRepo = clienteRepo;
        this.asistenteRepo = asistenteRepo;
        this.pujoRepo = pujoRepo;
        this.medioPagoRepo = medioPagoRepo;
        this.itemRepo = itemRepo;
        this.catalogoRepo = catalogoRepo;
        this.productoRepo = productoRepo;
        this.subastaRepo = subastaRepo;
        this.notificacionRepo = notificacionRepo;
    }

    @Transactional
    public PujaResponse crearPuja(Integer subastaId, Integer itemId, CreatePujaRequest req) {
        AuthPrincipal p = CurrentUser.requireCliente();
        Integer clienteId = p.clienteId();

        Subasta subasta = subastaService.findSubasta(subastaId);
        if (!"abierta".equals(subasta.getEstado())) {
            throw ApiException.conflict(ErrorCodes.SUBASTA_CERRADA, "La subasta no esta abierta");
        }

        ItemCatalogo item = subastaService.findItemEnSubasta(subastaId, itemId);
        if ("si".equals(item.getSubastado())) {
            throw ApiException.conflict(ErrorCodes.ITEM_ALREADY_SOLD, "El item ya fue vendido");
        }

        Asistente asistente = asistenteRepo.findByClienteAndSubasta(clienteId, subastaId)
                .orElseThrow(() -> ApiException.forbidden(ErrorCodes.NOT_PART_OF_SUBASTA,
                        "No estas unido a esta subasta"));

        if (!medioPagoRepo.existsByClienteAndEstado(clienteId, "verified")) {
            throw ApiException.forbidden(ErrorCodes.NO_VERIFIED_PAYMENT_METHOD,
                    "Necesitas un medio de pago verificado para pujar");
        }

        BigDecimal importe = req.importe();
        if (importe == null || importe.compareTo(BigDecimal.ZERO) <= 0) {
            throw ApiException.badRequest(ErrorCodes.INVALID_AMOUNT, "El importe debe ser mayor a cero");
        }

        Pujo top = pujoRepo.findTopByItemOrderByImporteDesc(itemId).orElse(null);
        BigDecimal ofertaActual = (top != null) ? top.getImporte() : null;

        PujaRules.Limites lim = PujaRules.calcular(item.getPrecioBase(), ofertaActual, subasta.getCategoria());
        if (importe.compareTo(lim.minima()) < 0) {
            throw ApiException.conflict(ErrorCodes.PUJA_TOO_LOW,
                    "La puja debe ser de al menos " + lim.minima());
        }
        if (lim.maxima() != null && importe.compareTo(lim.maxima()) > 0) {
            throw ApiException.conflict(ErrorCodes.PUJA_TOO_HIGH,
                    "La puja no puede superar " + lim.maxima());
        }

        Pujo pujo = new Pujo();
        pujo.setAsistente(asistente.getIdentificador());
        pujo.setItem(itemId);
        pujo.setImporte(importe);
        pujo.setGanador("no");
        pujo.setFechaHora(LocalDateTime.now());
        pujo = pujoRepo.save(pujo);

        // notificar al postor que fue superado
        if (top != null && !top.getAsistente().equals(asistente.getIdentificador())) {
            asistenteRepo.findById(top.getAsistente()).ifPresent(prev ->
                    crearNotificacion(prev.getCliente(), "PUJA_SUPERADA",
                            "Tu puja fue superada en la subasta " + subastaId));
        }

        return new PujaResponse(pujo.getIdentificador(), "Puja realizada", importe);
    }

    @Transactional
    public JoinResponse unirse(JoinRequest req) {
        AuthPrincipal p = CurrentUser.requireCliente();
        Integer clienteId = p.clienteId();
        Subasta subasta = subastaService.findSubasta(req.subastaId());

        if (!"abierta".equals(subasta.getEstado())) {
            throw ApiException.forbidden(ErrorCodes.NOT_ALLOWED, "Solo podes unirte a subastas abiertas");
        }
        Cliente cliente = clienteRepo.findById(clienteId)
                .orElseThrow(() -> ApiException.forbidden(ErrorCodes.NOT_CLIENT, "No sos cliente"));
        if (!"si".equals(cliente.getAdmitido())) {
            throw ApiException.forbidden(ErrorCodes.NOT_ALLOWED, "Tu cuenta no esta admitida");
        }
        if (!PujaRules.puedeAcceder(subasta.getCategoria(), cliente.getCategoria())) {
            throw ApiException.forbidden(ErrorCodes.NOT_ALLOWED,
                    "Tu categoria no permite acceder a esta subasta");
        }
        if (asistenteRepo.findByClienteAndSubasta(clienteId, req.subastaId()).isPresent()) {
            throw ApiException.conflict(ErrorCodes.ALREADY_JOINED, "Ya estas unido a esta subasta");
        }

        int numeroPostor = asistenteRepo.findTopBySubastaOrderByNumeroPostorDesc(req.subastaId())
                .map(a -> a.getNumeroPostor() + 1).orElse(1);

        Asistente asistente = new Asistente();
        asistente.setCliente(clienteId);
        asistente.setSubasta(req.subastaId());
        asistente.setNumeroPostor(numeroPostor);
        asistente = asistenteRepo.save(asistente);

        return new JoinResponse(asistente.getIdentificador(), numeroPostor);
    }

    @Transactional
    public void salir() {
        AuthPrincipal p = CurrentUser.requireCliente();
        Integer clienteId = p.clienteId();

        Asistente target = asistenteRepo.findByCliente(clienteId).stream()
                .filter(a -> subastaRepo.findById(a.getSubasta())
                        .map(s -> "abierta".equals(s.getEstado())).orElse(false))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_PART_OF_SUBASTA,
                        "No estas unido a ninguna subasta abierta"));

        // solo se elimina la asistencia si no tiene pujas (las pujas son historico)
        if (pujoRepo.findByAsistenteIn(List.of(target.getIdentificador())).isEmpty()) {
            asistenteRepo.delete(target);
        }
    }

    public List<MySubastaDto> getMisSubastas() {
        AuthPrincipal p = CurrentUser.requireCliente();
        return asistenteRepo.findByCliente(p.clienteId()).stream()
                .map(a -> new MySubastaDto(a.getSubasta(),
                        subastaRepo.findById(a.getSubasta()).map(Subasta::getEstado).orElse(null)))
                .toList();
    }

    public List<PujaDto> getMisPujas(String ganador, Integer productoId) {
        AuthPrincipal p = CurrentUser.requireCliente();
        List<Integer> asistIds = asistenteRepo.findByCliente(p.clienteId()).stream()
                .map(Asistente::getIdentificador).toList();
        if (asistIds.isEmpty()) return List.of();

        List<Pujo> pujos = (ganador != null)
                ? pujoRepo.findByAsistenteInAndGanador(asistIds, ganador)
                : pujoRepo.findByAsistenteIn(asistIds);

        return pujos.stream()
                .filter(pj -> productoId == null || matchesProducto(pj.getItem(), productoId))
                .map(this::toPujaDto)
                .toList();
    }

    public PujaDto getPujaById(Integer id) {
        AuthPrincipal p = CurrentUser.requireCliente();
        Pujo pujo = pujoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PUJA_NOT_FOUND, "La puja no existe"));
        Asistente asistente = asistenteRepo.findById(pujo.getAsistente()).orElse(null);
        if (asistente == null || !asistente.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER_OF_PUJA, "Esta puja no es tuya");
        }
        return toPujaDto(pujo);
    }

    // ---- helpers ----

    private boolean matchesProducto(Integer itemId, Integer productoId) {
        return itemRepo.findById(itemId).map(i -> productoId.equals(i.getProducto())).orElse(false);
    }

    private PujaDto toPujaDto(Pujo pj) {
        ItemCatalogo item = itemRepo.findById(pj.getItem()).orElse(null);
        Integer subastaId = null;
        String producto = null;
        if (item != null) {
            subastaId = catalogoRepo.findById(item.getCatalogo())
                    .map(Catalogo::getSubasta).orElse(null);
            producto = productoRepo.findById(item.getProducto())
                    .map(Producto::getDescripcionCatalogo).orElse(null);
        }
        return new PujaDto(pj.getIdentificador(), subastaId, pj.getItem(), producto,
                pj.getImporte(), pj.getGanador(), pj.getFechaHora());
    }

    private void crearNotificacion(Integer clienteId, String tipo, String mensaje) {
        Notificacion n = new Notificacion();
        n.setCliente(clienteId);
        n.setTipo(tipo);
        n.setMensaje(mensaje);
        n.setLeido("no");
        n.setFecha(LocalDateTime.now());
        notificacionRepo.save(n);
    }
}
