package com.subastas.api.service;

import com.subastas.api.domain.*;
import com.subastas.api.dto.*;
import com.subastas.api.repository.*;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MetricaService {
    private static final String ESTADO_ABIERTA = "abierta";
    private static final String ESTADO_CERRADA = "cerrada";
    private static final String ESTADO_CERRADA_DB = "carrada";

    private final AsistenteRepository asistenteRepo;
    private final SubastaRepository subastaRepo;
    private final PujoRepository pujoRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final FacturaRepository facturaRepo;
    private final ProductoRepository productoRepo;

    public MetricaService(AsistenteRepository asistenteRepo, SubastaRepository subastaRepo,
                          PujoRepository pujoRepo, RegistroDeSubastaRepository registroRepo,
                          FacturaRepository facturaRepo, ProductoRepository productoRepo) {
        this.asistenteRepo = asistenteRepo;
        this.subastaRepo = subastaRepo;
        this.pujoRepo = pujoRepo;
        this.registroRepo = registroRepo;
        this.facturaRepo = facturaRepo;
        this.productoRepo = productoRepo;
    }

    public List<AsistenciaDto> getMyAsistencias() {
        Integer cliente = CurrentUser.requireCliente().clienteId();
        Set<Integer> ganadas = registroRepo.findByCliente(cliente).stream()
                .map(RegistroDeSubasta::getSubasta).collect(Collectors.toSet());
        return asistenteRepo.findByCliente(cliente).stream().map(a -> {
            Subasta s = subastaRepo.findById(a.getSubasta()).orElse(null);
            String estado = normalizeEstado(s == null ? null : s.getEstado());
            String resultado = ganadas.contains(a.getSubasta()) ? "ganada"
                    : isCerrada(estado) ? "sin_victoria" : "en_curso";
            return new AsistenciaDto(a.getSubasta(), a.getNumeroPostor(),
                    s == null ? null : s.getFecha(), s == null ? null : s.getHora(),
                    s == null ? null : s.getCategoria(), s == null ? null : s.getMoneda(),
                    estado, resultado);
        }).sorted(Comparator.comparing(AsistenciaDto::fecha,
                Comparator.nullsLast(Comparator.reverseOrder()))).toList();
    }

    public List<AsistenciaDto> getMySubastasHistory() {
        return getMyAsistencias();
    }

    public AsistenciasStatsResponse getAsistenciasStats() {
        List<AsistenciaDto> items = getMyAsistencias();
        Map<String, Long> categorias = items.stream().filter(x -> x.categoria() != null)
                .collect(Collectors.groupingBy(AsistenciaDto::categoria, LinkedHashMap::new, Collectors.counting()));
        return new AsistenciasStatsResponse(items.size(), categorias,
                items.stream().filter(x -> ESTADO_ABIERTA.equals(x.estado())).count(),
                items.stream().filter(x -> isCerrada(x.estado())).count());
    }

    public List<VictoriaDto> getMyVictories() {
        Integer cliente = CurrentUser.requireCliente().clienteId();
        return registroRepo.findByCliente(cliente).stream().map(r -> {
            Subasta s = subastaRepo.findById(r.getSubasta()).orElse(null);
            Producto p = productoRepo.findById(r.getProducto()).orElse(null);
            Factura f = facturaRepo.findByAdquisicion(r.getIdentificador()).orElse(null);
            return new VictoriaDto(r.getIdentificador(), r.getSubasta(), r.getProducto(),
                    p == null ? null : p.getDescripcionCatalogo(), r.getImporte(), r.getComision(),
                    f == null ? null : f.getTotal(), s == null ? null : s.getMoneda(), r.getEstado(), r.getFecha());
        }).sorted(Comparator.comparing(VictoriaDto::fecha,
                Comparator.nullsLast(Comparator.reverseOrder()))).toList();
    }

    public VictoriasStatsResponse getVictoriesStats() {
        List<VictoriaDto> victorias = getMyVictories();
        Map<String, Long> categorias = victorias.stream().map(v -> subastaRepo.findById(v.subastaId()).orElse(null))
                .filter(Objects::nonNull).map(Subasta::getCategoria)
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));
        Map<String, BigDecimal> importes = new LinkedHashMap<>();
        victorias.forEach(v -> importes.merge(v.moneda() == null ? "ARS" : v.moneda(),
                v.totalPagado() == null ? zero(v.importe()) : v.totalPagado(), BigDecimal::add));
        return new VictoriasStatsResponse(victorias.size(), categorias, importes);
    }

    public PujasStatsResponse getMyPujasStats() {
        List<Asistente> asistencias = asistenteRepo.findByCliente(CurrentUser.requireCliente().clienteId());
        List<Integer> ids = asistencias.stream().map(Asistente::getIdentificador).toList();
        List<Pujo> pujas = ids.isEmpty() ? List.of() : pujoRepo.findByAsistenteIn(ids);
        Map<Integer, Asistente> porId = asistencias.stream()
                .collect(Collectors.toMap(Asistente::getIdentificador, Function.identity()));
        BigDecimal total = pujas.stream().map(Pujo::getImporte).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal max = pujas.stream().map(Pujo::getImporte).filter(Objects::nonNull)
                .max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        Map<String, Long> categorias = new LinkedHashMap<>();
        Map<String, BigDecimal> monedas = new LinkedHashMap<>();
        pujas.forEach(p -> {
            Asistente a = porId.get(p.getAsistente());
            Subasta s = a == null ? null : subastaRepo.findById(a.getSubasta()).orElse(null);
            String cat = s == null || s.getCategoria() == null ? "sin_categoria" : s.getCategoria();
            String mon = s == null || s.getMoneda() == null ? "ARS" : s.getMoneda();
            categorias.merge(cat, 1L, Long::sum);
            monedas.merge(mon, zero(p.getImporte()), BigDecimal::add);
        });
        BigDecimal promedio = pujas.isEmpty() ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(pujas.size()), 2, RoundingMode.HALF_UP);
        return new PujasStatsResponse(pujas.size(), pujas.stream().filter(p -> "si".equals(p.getGanador())).count(),
                total, promedio, max, categorias, monedas);
    }

    private static BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static boolean isCerrada(String estado) {
        return ESTADO_CERRADA.equals(estado) || ESTADO_CERRADA_DB.equals(estado);
    }

    private static String normalizeEstado(String estado) {
        return ESTADO_CERRADA_DB.equals(estado) ? ESTADO_CERRADA : estado;
    }
}
