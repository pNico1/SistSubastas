package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.common.dto.PageResponse;
import com.subastas.api.domain.*;
import com.subastas.api.dto.*;
import com.subastas.api.repository.*;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Metricas y participacion del cliente autenticado (area 3 — perfil/metricas).
 * Solo lectura/agregacion sobre tablas existentes; no crea tablas nuevas.
 *
 * Relacion clave: cada puja la hace un 'asistente', y el asistente pertenece a
 * una subasta. Por eso para ubicar la subasta de una puja se usa
 * pujo -> asistente -> subasta (sin pasar por catalogo).
 */
@Service
public class MetricaService {

    private final AsistenteRepository asistenteRepo;
    private final SubastaRepository subastaRepo;
    private final PujoRepository pujoRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final ProductoRepository productoRepo;
    private final ItemCatalogoRepository itemRepo;

    public MetricaService(AsistenteRepository asistenteRepo, SubastaRepository subastaRepo,
                          PujoRepository pujoRepo, RegistroDeSubastaRepository registroRepo,
                          ProductoRepository productoRepo, ItemCatalogoRepository itemRepo) {
        this.asistenteRepo = asistenteRepo;
        this.subastaRepo = subastaRepo;
        this.pujoRepo = pujoRepo;
        this.registroRepo = registroRepo;
        this.productoRepo = productoRepo;
        this.itemRepo = itemRepo;
    }

    // ============================ ASISTENCIAS ============================

    public List<AsistenciaDto> getMyAsistencias() {
        Integer clienteId = CurrentUser.requireCliente().clienteId();
        List<Asistente> asistencias = asistenteRepo.findByCliente(clienteId);
        Map<Integer, Subasta> subastas = subastasOf(asistencias);
        return asistencias.stream().map(a -> {
            Subasta s = subastas.get(a.getSubasta());
            AsistenciaDto.SubastaRef ref = (s == null) ? null
                    : new AsistenciaDto.SubastaRef(s.getIdentificador(), s.getFecha(), s.getEstado());
            return new AsistenciaDto(a.getIdentificador(), ref, a.getNumeroPostor());
        }).toList();
    }

    public AsistenciasStatsDto getAsistenciasStats(String from, String to) {
        Integer clienteId = CurrentUser.requireCliente().clienteId();
        LocalDate desde = parseDate(from);
        LocalDate hasta = parseDate(to);
        validarRango(desde, hasta);

        List<Asistente> asistencias = asistenteRepo.findByCliente(clienteId);
        Map<Integer, Subasta> subastas = subastasOf(asistencias);

        // filtro por fecha de subasta
        List<Asistente> filtradas = asistencias.stream()
                .filter(a -> enRango(fechaDe(subastas.get(a.getSubasta())), desde, hasta))
                .toList();

        // subastas en las que el cliente gano al menos una pieza
        Set<Integer> subastasGanadas = registroRepo.findByCliente(clienteId).stream()
                .map(RegistroDeSubasta::getSubasta)
                .collect(Collectors.toSet());

        // pujas del cliente (para "ofertado")
        List<Pujo> pujas = pujasDe(asistencias);
        BigDecimal totalOfertado = pujas.stream()
                .filter(pj -> enRango(fechaDe(subastas.get(subastaDeAsistente(asistencias, pj.getAsistente()))), desde, hasta))
                .map(Pujo::getImporte).reduce(BigDecimal.ZERO, BigDecimal::add);

        // pagos/comisiones de las piezas ganadas
        List<RegistroDeSubasta> registros = registroRepo.findByCliente(clienteId).stream()
                .filter(r -> enRango(fechaDe(subastas.get(r.getSubasta())), desde, hasta))
                .toList();
        BigDecimal totalPagado = registros.stream()
                .filter(r -> pagado(r.getEstado()))
                .map(r -> nz(r.getImporte())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalComisiones = registros.stream()
                .filter(r -> pagado(r.getEstado()))
                .map(r -> nz(r.getComision())).reduce(BigDecimal.ZERO, BigDecimal::add);

        long ganadas = filtradas.stream()
                .filter(a -> subastasGanadas.contains(a.getSubasta()))
                .count();

        // desglose por categoria: {asistencias, ganadas}
        Map<String, long[]> catTmp = new LinkedHashMap<>();
        for (Asistente a : filtradas) {
            Subasta s = subastas.get(a.getSubasta());
            String cat = (s != null && s.getCategoria() != null) ? s.getCategoria() : "sin_categoria";
            long[] acc = catTmp.computeIfAbsent(cat, k -> new long[2]);
            acc[0]++;
            if (subastasGanadas.contains(a.getSubasta())) acc[1]++;
        }
        Map<String, AsistenciasStatsDto.CategoriaResumen> desgloseCat = new LinkedHashMap<>();
        catTmp.forEach((k, v) -> desgloseCat.put(k, new AsistenciasStatsDto.CategoriaResumen(v[0], v[1])));

        // desglose por moneda: {ofertado, pagado}
        Map<String, BigDecimal[]> monTmp = new LinkedHashMap<>();
        for (RegistroDeSubasta r : registros) {
            String mon = monedaDe(subastas.get(r.getSubasta()));
            BigDecimal[] acc = monTmp.computeIfAbsent(mon, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if (pagado(r.getEstado())) acc[1] = acc[1].add(nz(r.getImporte()));
        }
        for (Pujo pj : pujas) {
            Integer subId = subastaDeAsistente(asistencias, pj.getAsistente());
            if (!enRango(fechaDe(subastas.get(subId)), desde, hasta)) continue;
            String mon = monedaDe(subastas.get(subId));
            BigDecimal[] acc = monTmp.computeIfAbsent(mon, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            acc[0] = acc[0].add(nz(pj.getImporte()));
        }
        Map<String, AsistenciasStatsDto.MonedaResumen> desgloseMon = new LinkedHashMap<>();
        monTmp.forEach((k, v) -> desgloseMon.put(k, new AsistenciasStatsDto.MonedaResumen(v[0], v[1])));

        return new AsistenciasStatsDto(
                filtradas.size(), ganadas, filtradas.size() - ganadas,
                totalOfertado, totalPagado, totalComisiones,
                desgloseCat, desgloseMon);
    }

    // ============================ HISTORIAL ============================

    public List<SubastaHistorialDto> getMySubastasHistory() {
        Integer clienteId = CurrentUser.requireCliente().clienteId();
        List<Asistente> asistencias = asistenteRepo.findByCliente(clienteId);
        Map<Integer, Subasta> subastas = subastasOf(asistencias);
        Set<Integer> ganadas = registroRepo.findByCliente(clienteId).stream()
                .map(RegistroDeSubasta::getSubasta).collect(Collectors.toSet());
        // una entrada por subasta (sin duplicar si asistio varias veces)
        Map<Integer, SubastaHistorialDto> out = new LinkedHashMap<>();
        for (Asistente a : asistencias) {
            Subasta s = subastas.get(a.getSubasta());
            if (s == null || out.containsKey(s.getIdentificador())) continue;
            String resultado = ganadas.contains(s.getIdentificador()) ? "ganada" : "perdida";
            out.put(s.getIdentificador(), new SubastaHistorialDto(
                    s.getIdentificador(), s.getFecha(), s.getEstado(), resultado));
        }
        return new ArrayList<>(out.values());
    }

    // ============================ VICTORIAS ============================

    public PageResponse<VictoriaDto> getMyVictories(String from, String to, String auctionCategory,
                                                    String paymentStatus, int page, int pageSize) {
        Integer clienteId = CurrentUser.requireCliente().clienteId();
        LocalDate desde = parseDate(from);
        LocalDate hasta = parseDate(to);
        validarRango(desde, hasta);

        List<RegistroDeSubasta> registros = registroRepo.findByCliente(clienteId);
        Map<Integer, Subasta> subastas = registros.stream()
                .map(RegistroDeSubasta::getSubasta).distinct()
                .map(subastaRepo::findById).filter(Optional::isPresent).map(Optional::get)
                .collect(Collectors.toMap(Subasta::getIdentificador, s -> s, (a, b) -> a));

        List<VictoriaDto> victorias = registros.stream()
                .filter(r -> enRango(fechaDe(subastas.get(r.getSubasta())), desde, hasta))
                .filter(r -> auctionCategory == null
                        || auctionCategory.equalsIgnoreCase(categoriaDe(subastas.get(r.getSubasta()))))
                .filter(r -> paymentStatus == null
                        || paymentStatus.equalsIgnoreCase(mapPaymentStatus(r.getEstado())))
                .map(r -> toVictoria(r, subastas.get(r.getSubasta())))
                .collect(Collectors.toCollection(ArrayList::new));

        if (paymentStatus != null && !Set.of("pending", "paid", "defaulted").contains(paymentStatus.toLowerCase())) {
            throw ApiException.badRequest(ErrorCodes.INVALID_FILTER, "paymentStatus invalido");
        }

        // paginado en memoria
        int total = victorias.size();
        int safePage = Math.max(page, 0);
        int safeSize = pageSize <= 0 ? 10 : pageSize;
        int fromIdx = Math.min(safePage * safeSize, total);
        int toIdx = Math.min(fromIdx + safeSize, total);
        List<VictoriaDto> slice = victorias.subList(fromIdx, toIdx);
        int totalPages = (int) Math.ceil((double) total / safeSize);
        return new PageResponse<>(safePage, safeSize, total, totalPages, slice);
    }

    public VictoriasStatsDto getVictoriesStats(String from, String to, String auctionCategory) {
        Integer clienteId = CurrentUser.requireCliente().clienteId();
        LocalDate desde = parseDate(from);
        LocalDate hasta = parseDate(to);
        validarRango(desde, hasta);

        List<RegistroDeSubasta> registros = registroRepo.findByCliente(clienteId);
        Map<Integer, Subasta> subastas = registros.stream()
                .map(RegistroDeSubasta::getSubasta).distinct()
                .map(subastaRepo::findById).filter(Optional::isPresent).map(Optional::get)
                .collect(Collectors.toMap(Subasta::getIdentificador, s -> s, (a, b) -> a));

        List<RegistroDeSubasta> filtrados = registros.stream()
                .filter(r -> enRango(fechaDe(subastas.get(r.getSubasta())), desde, hasta))
                .filter(r -> auctionCategory == null
                        || auctionCategory.equalsIgnoreCase(categoriaDe(subastas.get(r.getSubasta()))))
                .toList();

        BigDecimal totalSpent = filtrados.stream()
                .map(r -> nz(r.getImporte()).add(nz(r.getComision())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> byCurrency = new LinkedHashMap<>();
        for (RegistroDeSubasta r : filtrados) {
            String mon = monedaDe(subastas.get(r.getSubasta()));
            byCurrency.merge(mon, nz(r.getImporte()).add(nz(r.getComision())), BigDecimal::add);
        }
        return new VictoriasStatsDto(filtrados.size(), totalSpent, byCurrency);
    }

    // ============================ PUJAS STATS ============================

    public PujasStatsDto getMyPujasStats(String from, String to, Integer subastaId, String categoria) {
        Integer clienteId = CurrentUser.requireCliente().clienteId();
        LocalDate desde = parseDate(from);
        LocalDate hasta = parseDate(to);
        validarRango(desde, hasta);

        List<Asistente> asistencias = asistenteRepo.findByCliente(clienteId);
        Map<Integer, Integer> asistenteToSubasta = asistencias.stream()
                .collect(Collectors.toMap(Asistente::getIdentificador, Asistente::getSubasta, (a, b) -> a));
        Map<Integer, Subasta> subastas = subastasOf(asistencias);

        List<Pujo> pujas = pujasDe(asistencias).stream()
                .filter(pj -> enRango(pj.getFechaHora() == null ? null : pj.getFechaHora().toLocalDate(), desde, hasta))
                .filter(pj -> {
                    Integer sid = asistenteToSubasta.get(pj.getAsistente());
                    if (subastaId != null && !subastaId.equals(sid)) return false;
                    if (categoria != null && !categoria.equalsIgnoreCase(categoriaDe(subastas.get(sid)))) return false;
                    return true;
                })
                .toList();

        long total = pujas.size();
        long ganadoras = pujas.stream().filter(pj -> "si".equalsIgnoreCase(pj.getGanador())).count();
        BigDecimal totalOfertado = pujas.stream().map(pj -> nz(pj.getImporte())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalGanado = pujas.stream().filter(pj -> "si".equalsIgnoreCase(pj.getGanador()))
                .map(pj -> nz(pj.getImporte())).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal promedio = total == 0 ? BigDecimal.ZERO
                : totalOfertado.divide(BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP);
        BigDecimal masAlta = pujas.stream().map(pj -> nz(pj.getImporte()))
                .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        Map<String, Long> porCategoria = new LinkedHashMap<>();
        Map<String, BigDecimal> porMoneda = new LinkedHashMap<>();
        for (Pujo pj : pujas) {
            Integer sid = asistenteToSubasta.get(pj.getAsistente());
            Subasta s = subastas.get(sid);
            porCategoria.merge(categoriaDe(s), 1L, Long::sum);
            porMoneda.merge(monedaDe(s), nz(pj.getImporte()), BigDecimal::add);
        }

        return new PujasStatsDto(total, ganadoras, total - ganadoras,
                totalOfertado, totalGanado, promedio, masAlta, porCategoria, porMoneda);
    }

    // ============================ helpers ============================

    private Map<Integer, Subasta> subastasOf(List<Asistente> asistencias) {
        Set<Integer> ids = asistencias.stream().map(Asistente::getSubasta).collect(Collectors.toSet());
        return subastaRepo.findAllById(ids).stream()
                .collect(Collectors.toMap(Subasta::getIdentificador, s -> s, (a, b) -> a));
    }

    private List<Pujo> pujasDe(List<Asistente> asistencias) {
        List<Integer> ids = asistencias.stream().map(Asistente::getIdentificador).toList();
        return ids.isEmpty() ? List.of() : pujoRepo.findByAsistenteIn(ids);
    }

    private Integer subastaDeAsistente(List<Asistente> asistencias, Integer asistenteId) {
        return asistencias.stream()
                .filter(a -> a.getIdentificador().equals(asistenteId))
                .map(Asistente::getSubasta).findFirst().orElse(null);
    }

    private VictoriaDto toVictoria(RegistroDeSubasta r, Subasta s) {
        Producto prod = (r.getProducto() == null) ? null : productoRepo.findById(r.getProducto()).orElse(null);
        BigDecimal precioBase = itemRepo.findFirstByProducto(r.getProducto())
                .map(ItemCatalogo::getPrecioBase).orElse(null);
        VictoriaDto.AuctionRef auction = (s == null) ? null
                : new VictoriaDto.AuctionRef(s.getIdentificador(), s.getFecha(), s.getCategoria(), monedaDe(s));
        VictoriaDto.ItemRef item = new VictoriaDto.ItemRef(
                r.getProducto(),
                prod != null ? prod.getDescripcionCatalogo() : null,
                precioBase);
        return new VictoriaDto(
                r.getIdentificador(), auction, item,
                r.getImporte(), r.getComision(),
                nz(r.getImporte()).add(nz(r.getComision())),
                mapPaymentStatus(r.getEstado()));
    }

    private String mapPaymentStatus(String estado) {
        if (estado == null) return "pending";
        return switch (estado) {
            case "pagado", "entregado" -> "paid";
            case "en_mora" -> "defaulted";
            default -> "pending";
        };
    }

    private boolean pagado(String estado) {
        return "pagado".equals(estado) || "entregado".equals(estado);
    }

    private LocalDate fechaDe(Subasta s) { return s == null ? null : s.getFecha(); }
    private String categoriaDe(Subasta s) { return (s != null && s.getCategoria() != null) ? s.getCategoria() : "sin_categoria"; }
    private String monedaDe(Subasta s) { return (s != null && s.getMoneda() != null) ? s.getMoneda() : "ARS"; }

    private BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    /** true si la fecha esta dentro de [desde, hasta] (limites null = sin tope). */
    private boolean enRango(LocalDate fecha, LocalDate desde, LocalDate hasta) {
        if (desde == null && hasta == null) return true;
        if (fecha == null) return false;
        if (desde != null && fecha.isBefore(desde)) return false;
        if (hasta != null && fecha.isAfter(hasta)) return false;
        return true;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s);
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATE_RANGE, "Fecha invalida: " + s);
        }
    }

    private void validarRango(LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATE_RANGE, "El rango de fechas es invalido (from > to)");
        }
    }
}
