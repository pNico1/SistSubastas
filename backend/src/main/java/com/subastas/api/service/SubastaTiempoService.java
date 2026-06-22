package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Asistente;
import com.subastas.api.domain.Catalogo;
import com.subastas.api.domain.ItemCatalogo;
import com.subastas.api.domain.Producto;
import com.subastas.api.domain.Pujo;
import com.subastas.api.domain.RegistroDeSubasta;
import com.subastas.api.domain.CompraEmpresa;
import com.subastas.api.domain.Subasta;
import com.subastas.api.repository.AsistenteRepository;
import com.subastas.api.repository.CompraEmpresaRepository;
import com.subastas.api.repository.CatalogoRepository;
import com.subastas.api.repository.ItemCatalogoRepository;
import com.subastas.api.repository.ProductoRepository;
import com.subastas.api.repository.PujoRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.repository.SubastaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;

/**
 * Motor temporal de la subasta (calculado por tiempo, sin scheduler).
 *
 * La subasta arranca en fecha+hora. Los items se subastan de a uno, en orden de
 * identificador. Un item "termina" por inactividad: si no recibe una puja dentro
 * de {@link #INACTIVIDAD_SEG} segundos desde su inicio o desde la ultima puja.
 * Entre un item y el siguiente hay un gap de {@link #GAP_SEG} segundos. Cuando
 * termina el ultimo item, la subasta se cierra.
 *
 * Todo el estado (que item esta activo, si la subasta cerro) se CALCULA a partir
 * del tiempo y de las pujas existentes en cada lectura. Como efecto, cuando un
 * item ya termino se materializa una sola vez: se marca el item como subastado y
 * la puja mas alta como ganadora.
 */
@Service
public class SubastaTiempoService {

    /** Segundos sin pujas para que un item se cierre. */
    public static final int INACTIVIDAD_SEG = 30;
    /** Gap entre el cierre de un item y el inicio del siguiente. */
    public static final int GAP_SEG = 10;

    private final SubastaRepository subastaRepo;
    private final CatalogoRepository catalogoRepo;
    private final ItemCatalogoRepository itemRepo;
    private final PujoRepository pujoRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final AsistenteRepository asistenteRepo;
    private final ProductoRepository productoRepo;
    private final CompraEmpresaRepository compraEmpresaRepo;
    private final NotificacionService notificacionService;
    private final LiquidacionVentaService liquidacionService;

    public SubastaTiempoService(SubastaRepository subastaRepo, CatalogoRepository catalogoRepo,
                                ItemCatalogoRepository itemRepo, PujoRepository pujoRepo,
                                RegistroDeSubastaRepository registroRepo, AsistenteRepository asistenteRepo,
                                ProductoRepository productoRepo, CompraEmpresaRepository compraEmpresaRepo,
                                NotificacionService notificacionService, LiquidacionVentaService liquidacionService) {
        this.subastaRepo = subastaRepo;
        this.catalogoRepo = catalogoRepo;
        this.itemRepo = itemRepo;
        this.pujoRepo = pujoRepo;
        this.registroRepo = registroRepo;
        this.asistenteRepo = asistenteRepo;
        this.productoRepo = productoRepo;
        this.compraEmpresaRepo = compraEmpresaRepo;
        this.notificacionService = notificacionService;
        this.liquidacionService = liquidacionService;
    }

    /**
     * Fase actual de la subasta.
     * estado: programada (aun no arranco) / abierta / cerrada.
     * itemActivoId: el item que se esta subastando ahora (null en pausa/gap, programada o cerrada).
     * itemTermina: instante en que el item activo se cierra por inactividad.
     * proximoArranca: cuando arranca la subasta (si programada) o el proximo item (si en gap).
     */
    public record Fase(String estado, Integer itemActivoId,
                       LocalDateTime itemTermina, LocalDateTime proximoArranca) {}

    /** Calcula la fase y materializa los items/subasta que ya terminaron. */
    @Transactional
    public Fase materializar(Integer subastaId) {
        Subasta s = subastaRepo.findById(subastaId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.SUBASTA_NOT_FOUND, "La subasta no existe"));

        LocalDateTime inicio = inicioDe(s);
        LocalDateTime now = LocalDateTime.now();

        if (inicio == null || now.isBefore(inicio)) {
            return new Fase("programada", null, null, inicio);
        }

        List<ItemCatalogo> items = itemsOrdenados(subastaId);
        if (items.isEmpty()) {
            return new Fase("abierta", null, null, null);
        }

        LocalDateTime cursor = inicio;
        for (ItemCatalogo item : items) {
            LocalDateTime itemStart = cursor;
            List<Pujo> bids = pujoRepo.findByItemOrderByFechaHoraAsc(item.getIdentificador());

            // ultimo evento valido dentro de la ventana de inactividad
            LocalDateTime lastEvent = itemStart;
            for (Pujo b : bids) {
                if (b.getFechaHora() == null) continue;
                if (!b.getFechaHora().isAfter(lastEvent.plusSeconds(INACTIVIDAD_SEG))) {
                    lastEvent = b.getFechaHora();
                } else {
                    break;
                }
            }
            LocalDateTime itemEnd = lastEvent.plusSeconds(INACTIVIDAD_SEG);

            if (now.isBefore(itemEnd)) {
                if (now.isBefore(itemStart)) {
                    // gap entre items: todavia no arranco este item
                    return new Fase("abierta", null, null, itemStart);
                }
                return new Fase("abierta", item.getIdentificador(), itemEnd, null);
            }

            // el item ya termino -> materializar resultado (idempotente)
            cerrarItem(subastaId, item, bids);
            cursor = itemEnd.plusSeconds(GAP_SEG);
        }

        // todos los items terminaron -> cerrar subasta
        if (!"carrada".equals(s.getEstado())) {
            s.setEstado("carrada");   // valor literal del CHECK original (typo por 'cerrada')
            subastaRepo.save(s);
        }
        return new Fase("cerrada", null, null, null);
    }

    /** Solo lectura: igual que materializar pero sin forzar el commit desde afuera. */
    public Fase fase(Integer subastaId) {
        return materializar(subastaId);
    }

    // ---- helpers ----

    private void cerrarItem(Integer subastaId, ItemCatalogo item, List<Pujo> bids) {
        if ("si".equals(item.getSubastado())) return;   // ya materializado

        Pujo ganador = bids.stream()
                .filter(b -> b.getImporte() != null)
                .max(Comparator.comparing(Pujo::getImporte))
                .orElse(null);

        if (ganador != null) {
            ganador.setGanador("si");
            pujoRepo.save(ganador);
            crearAdquisicion(subastaId, item, ganador);
        } else {
            // Nadie pujo: la empresa compra la pieza al precio base. Como no hay
            // cliente, no entra en registroDeSubasta; se registra en comprasEmpresa.
            registrarCompraEmpresa(subastaId, item);
        }

        item.setSubastado("si");
        itemRepo.save(item);
        boolean ventaRegistrada = ganador == null
                ? compraEmpresaRepo.findBySubastaAndProducto(subastaId, item.getProducto()).isPresent()
                : registroRepo.findBySubasta(subastaId).stream()
                        .anyMatch(r -> item.getProducto().equals(r.getProducto()));
        if (ventaRegistrada) registrarVentaDelProducto(item.getProducto(), ganador == null);
    }

    private void registrarVentaDelProducto(Integer productoId, boolean compradaPorEmpresa) {
        Producto producto = productoRepo.findById(productoId).orElse(null);
        if (producto == null) return;
        producto.setEstado("vendido");
        producto.setDisponible("no");
        productoRepo.save(producto);
        String mensaje = compradaPorEmpresa
                ? "Tu objeto fue comprado por la empresa al valor base porque no recibio pujas. Consulta el detalle de la venta."
                : "Tu objeto fue vendido al mejor postor. Consulta el precio final y el importe neto de la venta.";
        notificacionService.crearParaCliente(producto.getDuenio(),
                "OBJETO_VENDIDO:" + productoId, mensaje);
    }

    /** Registra la compra de la empresa de una pieza sin pujas. Idempotente. */
    private void registrarCompraEmpresa(Integer subastaId, ItemCatalogo item) {
        if (compraEmpresaRepo.findBySubastaAndProducto(subastaId, item.getProducto()).isPresent()) return;
        Integer duenio = productoRepo.findById(item.getProducto())
                .map(Producto::getDuenio).orElse(null);
        if (duenio == null) return;

        CompraEmpresa c = new CompraEmpresa();
        c.setSubasta(subastaId);
        c.setProducto(item.getProducto());
        c.setDuenio(duenio);
        c.setPrecioBase(item.getPrecioBase());
        c.setComision(item.getComision());
        c.setFecha(LocalDateTime.now());
        c = compraEmpresaRepo.save(c);
        Producto producto = productoRepo.findById(item.getProducto()).orElse(null);
        if (producto != null) {
            String moneda = subastaRepo.findById(subastaId).map(Subasta::getMoneda).orElse("ARS");
            liquidacionService.registrar(producto, null, c.getId(), c.getPrecioBase(), c.getComision(), moneda, true);
        }
    }

    /** Registra la venta (adquisicion) del item al ganador. */
    private void crearAdquisicion(Integer subastaId, ItemCatalogo item, Pujo ganador) {
        // dedup defensivo: evita doble venta si el scheduler y una puja materializan a la vez
        boolean yaRegistrada = registroRepo.findBySubasta(subastaId).stream()
                .anyMatch(r -> item.getProducto().equals(r.getProducto()));
        if (yaRegistrada) return;

        Integer clienteGanador = asistenteRepo.findById(ganador.getAsistente())
                .map(Asistente::getCliente).orElse(null);
        Integer duenio = productoRepo.findById(item.getProducto())
                .map(Producto::getDuenio).orElse(null);
        if (clienteGanador == null || duenio == null) return;   // datos incompletos, no se registra

        RegistroDeSubasta r = new RegistroDeSubasta();
        r.setSubasta(subastaId);
        r.setProducto(item.getProducto());
        r.setDuenio(duenio);
        r.setCliente(clienteGanador);
        r.setImporte(ganador.getImporte());
        r.setComision(comisionValida(item.getComision()));
        r.setEstado("pendiente");
        r.setFecha(LocalDateTime.now());
        r = registroRepo.save(r);
        Producto producto = productoRepo.findById(item.getProducto()).orElse(null);
        if (producto != null) {
            String moneda = subastaRepo.findById(subastaId).map(Subasta::getMoneda).orElse("ARS");
            liquidacionService.registrar(producto, r.getIdentificador(), null, r.getImporte(), r.getComision(), moneda, false);
        }
        notificacionService.crearParaCliente(clienteGanador, "PUJA_GANADA:" + r.getIdentificador(),
                "Ganaste la puja. Elegí si querés retirar la pieza o recibirla en tu domicilio y completá el pago.");
    }

    /** registroDeSubasta.comision exige > 0.01 (CHECK de la DB). */
    private BigDecimal comisionValida(BigDecimal c) {
        BigDecimal min = new BigDecimal("0.01");
        return (c != null && c.compareTo(min) > 0) ? c : min;
    }

    private List<ItemCatalogo> itemsOrdenados(Integer subastaId) {
        Catalogo c = catalogoRepo.findBySubasta(subastaId).orElse(null);
        if (c == null) return List.of();
        return itemRepo.findByCatalogo(c.getIdentificador()).stream()
                .sorted(Comparator.comparing(ItemCatalogo::getIdentificador))
                .toList();
    }

    /** Inicio = fecha + hora. Si no hay fecha, la subasta no tiene inicio definido. */
    private LocalDateTime inicioDe(Subasta s) {
        if (s.getFecha() == null) return null;
        LocalTime hora = s.getHora() != null ? s.getHora() : LocalTime.MIDNIGHT;
        return s.getFecha().atTime(hora);
    }
}
