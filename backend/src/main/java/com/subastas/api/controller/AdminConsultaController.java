package com.subastas.api.controller;

import com.subastas.api.domain.*;
import com.subastas.api.repository.*;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Endpoints de SOLO LECTURA para la empresa/admin. Cubren los huecos de
 * "descubrimiento" e "inspeccion" necesarios para recorrer el flujo completo:
 * antes solo existian los PUT .../verificar por id, pero no habia forma de
 * listar que clientes o medios de pago estaban pendientes, ni de inspeccionar
 * las facturas/ventas/compras que genera el cierre de una subasta.
 *
 * No modifica ninguna tabla original ni agrega columnas: solo consulta.
 * Toda la ruta /api/admin/** ya esta restringida a ROLE_EMPLEADO (SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminConsultaController {

    private final ClienteRepository clienteRepo;
    private final PersonaRepository personaRepo;
    private final UsuarioRepository usuarioRepo;
    private final MedioPagoRepository medioPagoRepo;
    private final SubastaRepository subastaRepo;
    private final FacturaRepository facturaRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final CompraEmpresaRepository compraEmpresaRepo;

    public AdminConsultaController(ClienteRepository clienteRepo,
                                   PersonaRepository personaRepo,
                                   UsuarioRepository usuarioRepo,
                                   MedioPagoRepository medioPagoRepo,
                                   SubastaRepository subastaRepo,
                                   FacturaRepository facturaRepo,
                                   RegistroDeSubastaRepository registroRepo,
                                   CompraEmpresaRepository compraEmpresaRepo) {
        this.clienteRepo = clienteRepo;
        this.personaRepo = personaRepo;
        this.usuarioRepo = usuarioRepo;
        this.medioPagoRepo = medioPagoRepo;
        this.subastaRepo = subastaRepo;
        this.facturaRepo = facturaRepo;
        this.registroRepo = registroRepo;
        this.compraEmpresaRepo = compraEmpresaRepo;
    }

    // ---- Descubrimiento: a quien hay que verificar ----

    /**
     * Lista clientes. ?pendientes=true devuelve solo los que aun no estan
     * admitidos (admitido distinto de 'si', incluye null), que son los que la
     * empresa todavia tiene que verificar con PUT /clientes/{id}/verificar.
     */
    @GetMapping("/clientes")
    public List<Map<String, Object>> listarClientes(
            @RequestParam(required = false) Boolean pendientes,
            @RequestParam(required = false) String admitido) {
        return clienteRepo.findAll().stream()
                .filter(c -> admitido == null || admitido.equalsIgnoreCase(nullToEmpty(c.getAdmitido())))
                .filter(c -> !Boolean.TRUE.equals(pendientes) || !"si".equalsIgnoreCase(nullToEmpty(c.getAdmitido())))
                .map(this::clienteResumen)
                .toList();
    }

    /**
     * Lista medios de pago. ?estado=pending devuelve los que esperan
     * verificacion (PUT /metodos-pago/{id}/verificar).
     */
    @GetMapping("/metodos-pago")
    public List<MedioPago> listarMetodosPago(@RequestParam(required = false) String estado) {
        return medioPagoRepo.findAll().stream()
                .filter(m -> estado == null || estado.equalsIgnoreCase(nullToEmpty(m.getEstado())))
                .toList();
    }

    // ---- Inspeccion: que genero el circuito ----

    /** Lista las subastas (opcionalmente filtradas por estado: abierta/carrada/null). */
    @GetMapping("/subastas")
    public List<Subasta> listarSubastas(@RequestParam(required = false) String estado) {
        return subastaRepo.findAll().stream()
                .filter(s -> estado == null || estado.equalsIgnoreCase(nullToEmpty(s.getEstado())))
                .toList();
    }

    /** Lista las facturas generadas. ?subasta= filtra por la subasta de la adquisicion. */
    @GetMapping("/facturas")
    public List<Factura> listarFacturas(@RequestParam(required = false) Integer subasta) {
        return facturaRepo.findAll().stream()
                .filter(f -> subasta == null || subasta.equals(subastaDeAdquisicion(f.getAdquisicion())))
                .toList();
    }

    /** Lista las ventas a clientes (registroDeSubasta). ?subasta= y ?estado= opcionales. */
    @GetMapping("/ventas")
    public List<RegistroDeSubasta> listarVentas(@RequestParam(required = false) Integer subasta,
                                                @RequestParam(required = false) String estado) {
        List<RegistroDeSubasta> base = (subasta != null)
                ? registroRepo.findBySubasta(subasta)
                : registroRepo.findAll();
        return base.stream()
                .filter(r -> estado == null || estado.equalsIgnoreCase(nullToEmpty(r.getEstado())))
                .toList();
    }

    /** Lista las piezas que la empresa compro al precio base por no recibir pujas. */
    @GetMapping("/compras-empresa")
    public List<CompraEmpresa> listarComprasEmpresa(@RequestParam(required = false) Integer subasta) {
        return (subasta != null) ? compraEmpresaRepo.findBySubasta(subasta) : compraEmpresaRepo.findAll();
    }

    // ---- helpers ----

    private Integer subastaDeAdquisicion(Integer adquisicionId) {
        if (adquisicionId == null) return null;
        return registroRepo.findById(adquisicionId).map(RegistroDeSubasta::getSubasta).orElse(null);
    }

    private Map<String, Object> clienteResumen(Cliente c) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("identificador", c.getIdentificador());
        personaRepo.findById(c.getIdentificador()).ifPresent(p -> {
            out.put("nombre", p.getNombre());
            out.put("apellido", p.getApellido());
            out.put("documento", p.getDocumento());
        });
        usuarioRepo.findByPersona(c.getIdentificador()).ifPresent(u -> {
            out.put("email", u.getEmail());
            out.put("estadoRegistro", u.getEstadoRegistro());
        });
        out.put("admitido", c.getAdmitido());
        out.put("categoria", c.getCategoria());
        out.put("numeroPais", c.getNumeroPais());
        out.put("verificador", c.getVerificador());
        return out;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
