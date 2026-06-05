package com.subastas.api.controller;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.*;
import com.subastas.api.repository.*;
import com.subastas.api.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final SubastaRepository subastaRepo;
    private final AsistenteRepository asistenteRepo;
    private final CatalogoRepository catalogoRepo;
    private final ItemCatalogoRepository itemRepo;
    private final ProductoRepository productoRepo;
    private final FotoRepository fotoRepo;
    private final DuenioRepository duenioRepo;
    private final SeguroRepository seguroRepo;
    private final RevisionRepository revisionRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final FacturaRepository facturaRepo;
    private final ClienteRepository clienteRepo;
    private final UsuarioRepository usuarioRepo;

    public AdminController(SubastaRepository subastaRepo,
                           AsistenteRepository asistenteRepo,
                           CatalogoRepository catalogoRepo,
                           ItemCatalogoRepository itemRepo,
                           ProductoRepository productoRepo,
                           FotoRepository fotoRepo,
                           DuenioRepository duenioRepo,
                           SeguroRepository seguroRepo,
                           RevisionRepository revisionRepo,
                           RegistroDeSubastaRepository registroRepo,
                           FacturaRepository facturaRepo,
                           ClienteRepository clienteRepo,
                           UsuarioRepository usuarioRepo) {
        this.subastaRepo = subastaRepo;
        this.asistenteRepo = asistenteRepo;
        this.catalogoRepo = catalogoRepo;
        this.itemRepo = itemRepo;
        this.productoRepo = productoRepo;
        this.fotoRepo = fotoRepo;
        this.duenioRepo = duenioRepo;
        this.seguroRepo = seguroRepo;
        this.revisionRepo = revisionRepo;
        this.registroRepo = registroRepo;
        this.facturaRepo = facturaRepo;
        this.clienteRepo = clienteRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @PutMapping("/clientes/{id}/verificar")
    public Map<String, Object> verificarCliente(@PathVariable Integer id,
                                                @RequestBody(required = false) Map<String, Object> body) {
        Cliente cliente = clienteRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CLIENTE_NOT_FOUND, "Cliente no encontrado"));
        cliente.setAdmitido("si");
        if (body != null && body.containsKey("categoria")) {
            cliente.setCategoria(str(body, "categoria"));
        }
        clienteRepo.save(cliente);

        usuarioRepo.findByPersona(id).ifPresent(usuario -> {
            if (!"active".equals(usuario.getEstadoRegistro())) {
                usuario.setEstadoRegistro("registration_incomplete");
                usuarioRepo.save(usuario);
            }
        });

        return Map.of("id", id, "admitido", "si", "mensaje", "Cliente verificado");
    }

    @PostMapping("/subastas")
    public ResponseEntity<Map<String, Object>> createSubasta(@RequestBody Map<String, Object> body) {
        Subasta s = new Subasta();
        s.setFecha(date(body, "fecha"));
        s.setHora(time(body, "hora"));
        s.setUbicacion(str(body, "ubicacion"));
        s.setCapacidadAsistentes(integer(body, "capacidadAsistentes"));
        s.setTieneDeposito(strOr(body, "tieneDeposito", "no"));
        s.setSeguridadPropia(strOr(body, "seguridadPropia", "no"));
        s.setCategoria(strOr(body, "categoria", "comun"));
        s.setSubastador(integer(body, "subastador"));
        s.setMoneda(strOr(body, "moneda", "ARS"));
        s.setEstado(strOr(body, "estado", "programada"));
        s = subastaRepo.save(s);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", s.getIdentificador(), "mensaje", "Subasta creada"));
    }

    @GetMapping("/subastas/{id}/asistentes")
    public List<Asistente> getAsistentes(@PathVariable Integer id) {
        requireSubasta(id);
        return asistenteRepo.findBySubasta(id);
    }

    @PostMapping("/subastas/{id}/cerrar")
    public Map<String, String> closeSubasta(@PathVariable Integer id) {
        Subasta s = requireSubasta(id);
        s.setEstado("cerrada");
        subastaRepo.save(s);
        return Map.of("mensaje", "Subasta cerrada correctamente");
    }

    @PostMapping("/catalogos")
    public ResponseEntity<Catalogo> createCatalogo(@RequestBody Map<String, Object> body) {
        Catalogo c = new Catalogo();
        c.setDescripcion(strOr(body, "descripcion", "Catalogo"));
        c.setSubasta(integer(body, "subasta"));
        c.setResponsable(integerOr(body, "responsable", currentAdminId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogoRepo.save(c));
    }

    @GetMapping("/catalogos/{id}")
    public Catalogo getCatalogo(@PathVariable Integer id) {
        return requireCatalogo(id);
    }

    @GetMapping("/catalogos/{id}/items")
    public List<ItemCatalogo> getCatalogoItems(@PathVariable Integer id) {
        requireCatalogo(id);
        return itemRepo.findByCatalogo(id);
    }

    @PostMapping("/catalogos/{id}/producto/{productId}")
    public ResponseEntity<ItemCatalogo> addProductoCatalogo(@PathVariable Integer id,
                                                            @PathVariable Integer productId,
                                                            @RequestBody(required = false) Map<String, Object> body) {
        requireCatalogo(id);
        requireProducto(productId);
        Map<String, Object> safeBody = body == null ? Map.of() : body;
        ItemCatalogo item = itemRepo.findByCatalogoAndProducto(id, productId).orElseGet(ItemCatalogo::new);
        item.setCatalogo(id);
        item.setProducto(productId);
        item.setPrecioBase(decimalOr(safeBody, "precioBase", BigDecimal.ONE));
        item.setComision(decimalOr(safeBody, "comision", BigDecimal.ONE));
        item.setSubastado(strOr(safeBody, "subastado", "no"));
        return ResponseEntity.status(HttpStatus.CREATED).body(itemRepo.save(item));
    }

    @DeleteMapping("/catalogos/{catalogoId}/producto/{productId}")
    public ResponseEntity<Void> removeProductoCatalogo(@PathVariable Integer catalogoId,
                                                       @PathVariable Integer productId) {
        ItemCatalogo item = itemRepo.findByCatalogoAndProducto(catalogoId, productId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ITEM_NOT_FOUND, "Item de catalogo no encontrado"));
        itemRepo.delete(item);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/catalogos/{id}")
    public Catalogo updateCatalogo(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Catalogo c = requireCatalogo(id);
        if (body.containsKey("descripcion")) c.setDescripcion(str(body, "descripcion"));
        if (body.containsKey("subasta")) c.setSubasta(integer(body, "subasta"));
        if (body.containsKey("responsable")) c.setResponsable(integer(body, "responsable"));
        return catalogoRepo.save(c);
    }

    @DeleteMapping("/catalogos/{id}")
    public ResponseEntity<Void> deleteCatalogo(@PathVariable Integer id) {
        Catalogo c = requireCatalogo(id);
        itemRepo.findByCatalogo(id).forEach(itemRepo::delete);
        catalogoRepo.delete(c);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/productos")
    public ResponseEntity<Producto> createProducto(@RequestBody Map<String, Object> body) {
        Producto p = new Producto();
        applyProductoFields(p, body);
        if (p.getDuenio() == null) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "El duenio es obligatorio");
        }
        p.setFecha(dateOr(body, "fecha", LocalDate.now()));
        p.setRevisor(integerOr(body, "revisor", currentAdminId()));
        p.setDisponible(strOr(body, "disponible", "no"));
        p.setEstado(strOr(body, "estado", "en_revision"));
        return ResponseEntity.status(HttpStatus.CREATED).body(productoRepo.save(p));
    }

    @GetMapping("/productos")
    public List<Producto> getProductos(@RequestParam(required = false) String search) {
        return search == null || search.isBlank()
                ? productoRepo.findAll()
                : productoRepo.findByDescripcionCatalogoContainingIgnoreCase(search);
    }

    @PutMapping("/productos/{id}")
    public Producto updateProducto(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Producto p = requireProducto(id);
        applyProductoFields(p, body);
        if (body.containsKey("fecha")) p.setFecha(date(body, "fecha"));
        if (body.containsKey("disponible")) p.setDisponible(str(body, "disponible"));
        if (body.containsKey("estado")) p.setEstado(str(body, "estado"));
        if (body.containsKey("revisor")) p.setRevisor(integer(body, "revisor"));
        return productoRepo.save(p);
    }

    @DeleteMapping("/productos/{id}")
    public ResponseEntity<Void> deleteProducto(@PathVariable Integer id) {
        Producto p = requireProducto(id);
        productoRepo.delete(p);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/productos/{id}/fotos")
    public ResponseEntity<Foto> addFotoProducto(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        requireProducto(id);
        Foto foto = new Foto();
        foto.setProducto(id);
        foto.setUrl(str(body, "url"));
        foto.setOrden(integerOr(body, "orden", 0));
        foto.setFoto(bytes(body, "foto"));
        return ResponseEntity.status(HttpStatus.CREATED).body(fotoRepo.save(foto));
    }

    @PutMapping("/productos/{id}/seguro")
    public Producto setSeguroProducto(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Producto p = requireProducto(id);
        String nroPoliza = str(body, "nroPoliza");
        if (nroPoliza != null && !nroPoliza.isBlank()) {
            requireSeguro(nroPoliza);
        }
        p.setSeguro(nroPoliza);
        return productoRepo.save(p);
    }

    @PutMapping("/duenios/{id}")
    public Duenio updateDuenio(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Duenio d = duenioRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Duenio no encontrado"));
        if (body.containsKey("numeroPais")) d.setNumeroPais(integer(body, "numeroPais"));
        if (body.containsKey("verificacionFinanciera")) d.setVerificacionFinanciera(str(body, "verificacionFinanciera"));
        if (body.containsKey("verificacionJudicial")) d.setVerificacionJudicial(str(body, "verificacionJudicial"));
        if (body.containsKey("calificacionRiesgo")) d.setCalificacionRiesgo(integer(body, "calificacionRiesgo"));
        if (body.containsKey("verificador")) d.setVerificador(integer(body, "verificador"));
        return duenioRepo.save(d);
    }

    @GetMapping("/seguros")
    public List<Seguro> getSeguros() {
        return seguroRepo.findAll();
    }

    @GetMapping("/seguros/{nroPoliza}")
    public Seguro getSeguro(@PathVariable String nroPoliza) {
        return requireSeguro(nroPoliza);
    }

    @PostMapping("/seguros")
    public ResponseEntity<Seguro> createSeguro(@RequestBody Map<String, Object> body) {
        Seguro s = new Seguro();
        s.setNroPoliza(str(body, "nroPoliza"));
        if (s.getNroPoliza() == null || s.getNroPoliza().isBlank()) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "El numero de poliza es obligatorio");
        }
        applySeguroFields(s, body);
        if (s.getImporte() == null) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "El importe del seguro es obligatorio");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(seguroRepo.save(s));
    }

    @PutMapping("/seguros/{nroPoliza}")
    public Seguro updateSeguro(@PathVariable String nroPoliza, @RequestBody Map<String, Object> body) {
        Seguro s = requireSeguro(nroPoliza);
        applySeguroFields(s, body);
        return seguroRepo.save(s);
    }

    @PostMapping("/facturas/generar/{subastaId}")
    public Map<String, Object> generarFacturas(@PathVariable Integer subastaId) {
        requireSubasta(subastaId);
        List<Factura> facturas = registroRepo.findBySubasta(subastaId).stream()
                .filter(r -> facturaRepo.findByAdquisicion(r.getIdentificador()).isEmpty())
                .map(this::crearFactura)
                .toList();
        return Map.of("generadas", facturas.size(), "facturas", facturas);
    }

    @PostMapping("/revisiones")
    public ResponseEntity<Revision> createRevision(@RequestBody Map<String, Object> body) {
        Integer productoId = integer(body, "producto");
        requireProducto(productoId);
        Revision r = new Revision();
        r.setProducto(productoId);
        r.setRevisor(integerOr(body, "revisor", currentAdminId()));
        r.setEstado(strOr(body, "estado", "pendiente"));
        r.setObservaciones(str(body, "observaciones"));
        r.setMotivo(str(body, "motivo"));
        r.setFecha(LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(revisionRepo.save(r));
    }

    @GetMapping("/revisiones")
    public List<Revision> getRevisiones(@RequestParam(required = false) String estado) {
        return estado == null ? revisionRepo.findAll() : revisionRepo.findByEstado(estado);
    }

    @PutMapping("/revisiones/{id}/aprobar")
    public Revision aprobarRevision(@PathVariable Integer id, @RequestBody(required = false) Map<String, Object> body) {
        Revision r = requireRevision(id);
        r.setEstado("aprobado");
        if (body != null && body.containsKey("observaciones")) r.setObservaciones(str(body, "observaciones"));
        Producto p = requireProducto(r.getProducto());
        p.setEstado("aprobado");
        p.setDisponible("si");
        productoRepo.save(p);
        return revisionRepo.save(r);
    }

    @PutMapping("/revisiones/{id}/rechazar")
    public Revision rechazarRevision(@PathVariable Integer id, @RequestBody(required = false) Map<String, Object> body) {
        Revision r = requireRevision(id);
        r.setEstado("rechazado");
        if (body != null && body.containsKey("motivo")) r.setMotivo(str(body, "motivo"));
        Producto p = requireProducto(r.getProducto());
        p.setEstado("rechazado");
        p.setDisponible("no");
        productoRepo.save(p);
        return revisionRepo.save(r);
    }

    private Factura crearFactura(RegistroDeSubasta r) {
        Factura f = new Factura();
        f.setAdquisicion(r.getIdentificador());
        f.setNumeroFactura("F" + r.getSubasta() + "-" + r.getIdentificador());
        f.setImporte(r.getImporte());
        f.setComision(r.getComision());
        f.setCostoEnvio(BigDecimal.ZERO);
        f.setTotal(nullToZero(r.getImporte()).add(nullToZero(r.getComision())));
        f.setFecha(LocalDateTime.now());
        return facturaRepo.save(f);
    }

    private void applyProductoFields(Producto p, Map<String, Object> body) {
        if (body.containsKey("descripcionCatalogo")) p.setDescripcionCatalogo(str(body, "descripcionCatalogo"));
        if (body.containsKey("descripcionCompleta")) p.setDescripcionCompleta(str(body, "descripcionCompleta"));
        if (p.getDescripcionCompleta() == null || p.getDescripcionCompleta().isBlank()) {
            p.setDescripcionCompleta(strOr(body, "descripcionCatalogo", "No Posee"));
        }
        if (body.containsKey("duenio")) p.setDuenio(integer(body, "duenio"));
        if (body.containsKey("seguro")) p.setSeguro(str(body, "seguro"));
        if (body.containsKey("nombreArtista")) p.setNombreArtista(str(body, "nombreArtista"));
        if (body.containsKey("fechaObra")) p.setFechaObra(str(body, "fechaObra"));
        if (body.containsKey("historia")) p.setHistoria(str(body, "historia"));
        if (body.containsKey("terminosAceptados")) p.setTerminosAceptados(str(body, "terminosAceptados"));
    }

    private void applySeguroFields(Seguro s, Map<String, Object> body) {
        if (body.containsKey("compania")) s.setCompania(str(body, "compania"));
        if (body.containsKey("polizaCombinada")) s.setPolizaCombinada(str(body, "polizaCombinada"));
        if (body.containsKey("importe")) s.setImporte(decimal(body, "importe"));
    }

    private Subasta requireSubasta(Integer id) {
        return subastaRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.SUBASTA_NOT_FOUND, "Subasta no encontrada"));
    }

    private Catalogo requireCatalogo(Integer id) {
        return catalogoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CATALOGO_NOT_FOUND, "Catalogo no encontrado"));
    }

    private Producto requireProducto(Integer id) {
        return productoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
    }

    private Seguro requireSeguro(String nroPoliza) {
        return seguroRepo.findById(nroPoliza)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Seguro no encontrado"));
    }

    private Revision requireRevision(Integer id) {
        return revisionRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Revision no encontrada"));
    }

    private Integer currentAdminId() {
        return CurrentUser.get().personaId();
    }

    private static String str(Map<String, Object> body, String key) {
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private static String strOr(Map<String, Object> body, String key, String fallback) {
        String value = str(body, key);
        return value == null || value.isBlank() ? fallback : value;
    }

    private static Integer integer(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) return null;
        if (value instanceof Number n) return n.intValue();
        return Integer.valueOf(String.valueOf(value));
    }

    private static Integer integerOr(Map<String, Object> body, String key, Integer fallback) {
        Integer value = integer(body, key);
        return value == null ? fallback : value;
    }

    private static BigDecimal decimal(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return new BigDecimal(String.valueOf(value));
    }

    private static BigDecimal decimalOr(Map<String, Object> body, String key, BigDecimal fallback) {
        BigDecimal value = decimal(body, key);
        return value == null ? fallback : value;
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static LocalDate date(Map<String, Object> body, String key) {
        String value = str(body, key);
        return value == null || value.isBlank() ? null : LocalDate.parse(value);
    }

    private static LocalDate dateOr(Map<String, Object> body, String key, LocalDate fallback) {
        LocalDate value = date(body, key);
        return value == null ? fallback : value;
    }

    private static LocalTime time(Map<String, Object> body, String key) {
        String value = str(body, key);
        return value == null || value.isBlank() ? null : LocalTime.parse(value);
    }

    private static byte[] bytes(Map<String, Object> body, String key) {
        String value = str(body, key);
        if (value == null || value.isBlank()) return new byte[0];
        String clean = value.replaceFirst("^data:[^;]*;base64,", "").trim();
        return Base64.getMimeDecoder().decode(clean);
    }
}
