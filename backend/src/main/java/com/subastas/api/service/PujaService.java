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
    private final SubastaTiempoService tiempoService;
    private final ClienteRepository clienteRepo;
    private final AsistenteRepository asistenteRepo;
    private final PujoRepository pujoRepo;
    private final MedioPagoRepository medioPagoRepo;
    private final ItemCatalogoRepository itemRepo;
    private final CatalogoRepository catalogoRepo;
    private final ProductoRepository productoRepo;
    private final SubastaRepository subastaRepo;
    private final NotificacionRepository notificacionRepo;
    private final UsuarioRepository usuarioRepo;
    private final RegistroDeSubastaRepository registroRepo;

    public PujaService(SubastaService subastaService, SubastaTiempoService tiempoService,
                       ClienteRepository clienteRepo,
                       AsistenteRepository asistenteRepo, PujoRepository pujoRepo,
                       MedioPagoRepository medioPagoRepo, ItemCatalogoRepository itemRepo,
                       CatalogoRepository catalogoRepo, ProductoRepository productoRepo,
                       SubastaRepository subastaRepo, NotificacionRepository notificacionRepo,
                       UsuarioRepository usuarioRepo, RegistroDeSubastaRepository registroRepo) {
        this.subastaService = subastaService;
        this.tiempoService = tiempoService;
        this.clienteRepo = clienteRepo;
        this.asistenteRepo = asistenteRepo;
        this.pujoRepo = pujoRepo;
        this.medioPagoRepo = medioPagoRepo;
        this.itemRepo = itemRepo;
        this.catalogoRepo = catalogoRepo;
        this.productoRepo = productoRepo;
        this.subastaRepo = subastaRepo;
        this.notificacionRepo = notificacionRepo;
        this.usuarioRepo = usuarioRepo;
        this.registroRepo = registroRepo;
    }

    @Transactional
    public PujaResponse crearPuja(Integer subastaId, Integer itemId, CreatePujaRequest req) {
        AuthPrincipal p = CurrentUser.requireCliente();
        requireActiveAccount(p);
        Integer clienteId = p.clienteId();

        Subasta subasta = subastaService.findSubasta(subastaId);

        // El motor temporal decide la fase de la subasta y cual es el item activo.
        SubastaTiempoService.Fase fase = tiempoService.materializar(subastaId);
        switch (fase.estado()) {
            case "programada" -> throw ApiException.conflict(ErrorCodes.SUBASTA_NOT_STARTED,
                    "La subasta todavia no comenzo");
            case "cerrada" -> throw ApiException.conflict(ErrorCodes.SUBASTA_CERRADA,
                    "La subasta ya finalizo");
            default -> { /* abierta */ }
        }
        if (fase.itemActivoId() == null) {
            throw ApiException.conflict(ErrorCodes.ITEM_NOT_ACTIVE,
                    "En este momento no se esta subastando ningun item; espera al proximo");
        }
        if (!fase.itemActivoId().equals(itemId)) {
            throw ApiException.conflict(ErrorCodes.ITEM_NOT_ACTIVE,
                    "Ese item no es el que se esta subastando ahora");
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

        // No tiene sentido pujarte a vos mismo: si ya tenes la oferta mas alta, no podes volver
        // a pujar hasta que alguien te supere.
        if (top != null && top.getAsistente().equals(asistente.getIdentificador())) {
            throw ApiException.conflict(ErrorCodes.ALREADY_HIGHEST_BIDDER,
                    "Ya tenes la oferta mas alta; espera a que alguien te supere para volver a pujar");
        }

        PujaRules.Limites lim = PujaRules.calcular(item.getPrecioBase(), ofertaActual, subasta.getCategoria());
        if (importe.compareTo(lim.minima()) < 0) {
            throw ApiException.conflict(ErrorCodes.PUJA_TOO_LOW,
                    "La puja debe ser de al menos " + lim.minima());
        }
        if (lim.maxima() != null && importe.compareTo(lim.maxima()) > 0) {
            throw ApiException.conflict(ErrorCodes.PUJA_TOO_HIGH,
                    "La puja no puede superar " + lim.maxima());
        }

        // Regla de garantia: si el cliente respalda sus compras con una garantia
        // (ej. cheque certificado con montoGarantia), el total de sus adquisiciones
        // mas esta puja no puede superar el monto garantizado. Si no tiene garantia
        // (monto en null/0), no aplica tope.
        BigDecimal garantia = medioPagoRepo.findByCliente(clienteId).stream()
                .map(MedioPago::getMontoGarantia)
                .filter(g -> g != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (garantia.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal comprometido = registroRepo.findByCliente(clienteId).stream()
                    .map(RegistroDeSubasta::getImporte)
                    .filter(i -> i != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (comprometido.add(importe).compareTo(garantia) > 0) {
                throw ApiException.conflict(ErrorCodes.GARANTIA_EXCEDIDA,
                        "La puja supera tu monto de garantia disponible (" + garantia + ")");
            }
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
        requireActiveAccount(p);
        Integer clienteId = p.clienteId();

        // No se puede unir a una subasta sin un medio de pago verificado.
        if (!medioPagoRepo.existsByClienteAndEstado(clienteId, "verified")) {
            throw ApiException.forbidden(ErrorCodes.NO_VERIFIED_PAYMENT_METHOD,
                    "Necesitas un medio de pago verificado para unirte a una subasta");
        }

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

        // Un usuario no puede estar conectado a mas de una subasta abierta a la vez
        // (enunciado: "los usuarios no pueden estar conectados en mas de una a la vez").
        boolean enOtraAbierta = asistenteRepo.findByCliente(clienteId).stream()
                .anyMatch(a -> !a.getSubasta().equals(req.subastaId())
                        && subastaRepo.findById(a.getSubasta())
                                .map(s -> "abierta".equals(s.getEstado())).orElse(false));
        if (enOtraAbierta) {
            throw ApiException.conflict(ErrorCodes.ALREADY_IN_ANOTHER_AUCTION,
                    "Ya estas conectado a otra subasta abierta; sali de ella antes de unirte a esta");
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

    private void requireActiveAccount(AuthPrincipal principal) {
        Usuario usuario = usuarioRepo.findById(principal.usuarioId())
                .orElseThrow(() -> ApiException.forbidden(ErrorCodes.UNAUTHORIZED, "No autenticado"));
        String estado = usuario.getEstadoRegistro() == null ? "" : usuario.getEstadoRegistro().trim();
        if ("pending_verification".equals(estado)) {
            throw ApiException.forbidden(ErrorCodes.ACCOUNT_PENDING_VERIFICATION,
                    "Tu cuenta todavia esta pendiente de verificacion");
        }
        if (!"active".equals(estado)) {
            throw ApiException.forbidden(ErrorCodes.ACCOUNT_REGISTRATION_INCOMPLETE,
                    "Tenes que completar el registro antes de participar en subastas");
        }
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
