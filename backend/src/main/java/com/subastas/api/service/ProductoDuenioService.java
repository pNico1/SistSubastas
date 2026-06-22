package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Cliente;
import com.subastas.api.domain.Duenio;
import com.subastas.api.domain.Empleado;
import com.subastas.api.domain.Foto;
import com.subastas.api.domain.Producto;
import com.subastas.api.domain.Devolucion;
import com.subastas.api.domain.Revision;
import com.subastas.api.dto.CreateProductoRequest;
import com.subastas.api.dto.DevolucionResponse;
import com.subastas.api.dto.EnvioInspeccionResponse;
import com.subastas.api.dto.ProductoDetalleDto;
import com.subastas.api.dto.ProductoCreatedDto;
import com.subastas.api.dto.ProductoDto;
import com.subastas.api.dto.RejectMotiveResponse;
import com.subastas.api.dto.TerminosRequest;
import com.subastas.api.dto.TerminosResponse;
import com.subastas.api.repository.ClienteRepository;
import com.subastas.api.repository.DevolucionRepository;
import com.subastas.api.repository.DuenioRepository;
import com.subastas.api.repository.EmpleadoRepository;
import com.subastas.api.repository.FotoRepository;
import com.subastas.api.repository.ProductoRepository;
import com.subastas.api.repository.RevisionRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/** Productos que el usuario (como dueño) entrego para subastar. */
@Service
public class ProductoDuenioService {

    // Limites para el payload de fotos (base64 en JSON).
    private static final int MIN_FOTOS = 6;
    private static final int MAX_FOTOS = 8;
    private static final long MAX_FOTO_BYTES = 5L * 1024 * 1024;    // 5 MB por foto
    private static final long MAX_TOTAL_BYTES = 15L * 1024 * 1024;  // 15 MB en total

    private final ProductoRepository productoRepo;
    private final FotoRepository fotoRepo;
    private final DuenioRepository duenioRepo;
    private final ClienteRepository clienteRepo;
    private final EmpleadoRepository empleadoRepo;
    private final RevisionRepository revisionRepo;
    private final DevolucionRepository devolucionRepo;
    private final ProductoConsultaService consultaService;
    private final NotificacionService notificacionService;
    private final SeguroService seguroService;
    private final CuentaCobroService cuentaCobroService;

    @Value("${app.inspeccion.direccion:Av. del Puerto 1450, Depósito 3, CABA}")
    private String direccionInspeccion;

    public ProductoDuenioService(ProductoRepository productoRepo, FotoRepository fotoRepo,
                                 DuenioRepository duenioRepo, ClienteRepository clienteRepo,
                                 EmpleadoRepository empleadoRepo, RevisionRepository revisionRepo,
                                 DevolucionRepository devolucionRepo, ProductoConsultaService consultaService,
                                 NotificacionService notificacionService, SeguroService seguroService,
                                 CuentaCobroService cuentaCobroService) {
        this.productoRepo = productoRepo;
        this.fotoRepo = fotoRepo;
        this.duenioRepo = duenioRepo;
        this.clienteRepo = clienteRepo;
        this.empleadoRepo = empleadoRepo;
        this.revisionRepo = revisionRepo;
        this.devolucionRepo = devolucionRepo;
        this.consultaService = consultaService;
        this.notificacionService = notificacionService;
        this.seguroService = seguroService;
        this.cuentaCobroService = cuentaCobroService;
    }

    public List<ProductoDto> misProductos() {
        AuthPrincipal p = CurrentUser.get();
        List<Producto> productos = productoRepo.findByDuenio(p.personaId());
        productos.forEach(seguroService::asegurarSiCorresponde);
        return productos.stream().map(this::toDto).toList();
    }

    public ProductoDto getById(Integer id) {
        AuthPrincipal p = CurrentUser.get();
        Producto prod = productoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
        if (!prod.getDuenio().equals(p.personaId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER_OF_PRODUCTO, "Este producto no es tuyo");
        }
        return toDto(prod);
    }

    public ProductoDetalleDto getDetalleById(Integer id) {
        Producto producto = requireOwned(id);
        seguroService.asegurarSiCorresponde(producto);
        return consultaService.getProductoById(id);
    }

    public RejectMotiveResponse getRejectMotive(Integer id) {
        requireOwned(id);
        Revision revision = revisionRepo.findFirstByProductoAndEstadoOrderByFechaDesc(id, "rechazado")
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "El producto no tiene un rechazo registrado"));
        Devolucion devolucion = devolucionRepo.findById(id).orElse(null);
        return new RejectMotiveResponse(revision.getMotivo(), revision.getFecha(),
                devolucion == null ? null : devolucion.getCostoEnvio(),
                devolucion == null ? null : devolucion.getMoneda());
    }

    @Transactional
    public TerminosResponse updateProductTermsAcceptance(Integer id, TerminosRequest request) {
        Producto producto = requireOwned(id);
        if (!List.of("aprobado", "aceptado").contains(producto.getEstado())) {
            throw ApiException.conflict(ErrorCodes.CONFLICT,
                    "Los terminos solo pueden responderse para un producto aprobado");
        }
        boolean aceptados = Boolean.TRUE.equals(request.aceptados());
        if (aceptados) cuentaCobroService.requireActiva(producto.getDuenio());
        producto.setTerminosAceptados(aceptados ? "si" : "no");
        producto.setEstado(aceptados ? "aceptado" : "devuelto");
        producto.setDisponible(aceptados ? "si" : "no");
        productoRepo.save(producto);
        return new TerminosResponse(id, aceptados, producto.getEstado());
    }

    public DevolucionResponse getProductReturnDetails(Integer id) {
        requireOwned(id);
        Devolucion d = devolucionRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Devolucion no encontrada"));
        return new DevolucionResponse(d.getEstadoEnvio(), d.getTransportista(), d.getCodigoSeguimiento(),
                d.getCostoEnvio(), d.getMoneda(), d.getDireccion());
    }

    public EnvioInspeccionResponse getInspectionShippingDetails(Integer id) {
        Producto producto = requireOwned(id);
        return new EnvioInspeccionResponse(id, producto.getDescripcionCatalogo(), direccionInspeccion,
                "Enviá o acercá el bien a esta dirección para que la empresa realice la inspección.",
                "Si el bien no es aceptado, será devuelto con cargo a su dueño.");
    }

    /**
     * Ofrecer un bien: el dueño carga un producto con fotos. Queda en revision
     * para que un empleado lo apruebe antes de poder subastarse.
     */
    @Transactional
    public ProductoCreatedDto crear(CreateProductoRequest req) {
        AuthPrincipal p = CurrentUser.get();

        if (!Boolean.TRUE.equals(req.terminosAceptados())) {
            throw ApiException.unprocessable(ErrorCodes.TERMS_NOT_ACCEPTED,
                    "Debes aceptar los terminos para ofrecer un bien");
        }

        List<byte[]> fotos = decodeFotos(req.fotos());

        // El dueño puede no estar dado de alta todavia: lo creamos pendiente de
        // verificacion (financiera/judicial las completa un empleado luego).
        Duenio duenio = duenioRepo.findById(p.personaId())
                .orElseGet(() -> crearDuenioPendiente(p.personaId()));

        Integer revisor = primerEmpleado();

        Producto prod = new Producto();
        prod.setDuenio(duenio.getIdentificador());
        prod.setRevisor(revisor);
        prod.setFecha(LocalDate.now());
        prod.setDisponible("no");   // no disponible hasta que se apruebe
        prod.setDescripcionCatalogo(req.descripcionCatalogo());
        prod.setDescripcionCompleta(blankToFallback(req.descripcionCompleta(), req.descripcionCatalogo()));
        prod.setNombreArtista(emptyToNull(req.nombreArtista()));
        prod.setFechaObra(emptyToNull(req.fechaObra()));
        prod.setHistoria(emptyToNull(req.historia()));
        prod.setTerminosAceptados("si");
        prod.setEstado("en_revision");
        prod.setSeguro(null);
        prod = productoRepo.save(prod);

        int orden = 0;
        for (byte[] bytes : fotos) {
            Foto f = new Foto();
            f.setProducto(prod.getIdentificador());
            f.setFoto(bytes);
            f.setOrden(orden++);
            fotoRepo.save(f);
        }

        notificacionService.crearParaCliente(p.personaId(), "ENVIO_INSPECCION:" + prod.getIdentificador(),
                "Recibimos tu solicitud. Consultá la dirección donde debés enviar el producto para su inspección.");

        return new ProductoCreatedDto(
                prod.getIdentificador(), prod.getEstado(), prod.getDescripcionCatalogo(),
                fotos.size(), "Tu producto quedo en revision");
    }

    // ---- helpers ----

    /** Decodifica y valida las fotos base64; lanza errores claros segun el caso. */
    private List<byte[]> decodeFotos(List<String> raw) {
        if (raw == null || raw.size() < MIN_FOTOS) {
            throw ApiException.badRequest(ErrorCodes.NO_PHOTOS,
                    "Subi al menos " + MIN_FOTOS + " fotos del producto");
        }
        if (raw.size() > MAX_FOTOS) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, ErrorCodes.PAYLOAD_TOO_LARGE,
                    "Maximo " + MAX_FOTOS + " fotos por producto");
        }
        List<byte[]> out = new ArrayList<>();
        long total = 0;
        for (String s : raw) {
            String b64 = s == null ? "" : s.replaceFirst("^data:[^;]*;base64,", "").trim();
            byte[] bytes;
            try {
                bytes = Base64.getMimeDecoder().decode(b64);
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest(ErrorCodes.INVALID_IMAGE, "Una de las imagenes no es base64 valido");
            }
            if (bytes.length == 0) {
                throw ApiException.badRequest(ErrorCodes.INVALID_IMAGE, "Una de las imagenes esta vacia");
            }
            if (bytes.length > MAX_FOTO_BYTES) {
                throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, ErrorCodes.PAYLOAD_TOO_LARGE,
                        "Cada foto debe pesar menos de 5 MB");
            }
            total += bytes.length;
            out.add(bytes);
        }
        if (total > MAX_TOTAL_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, ErrorCodes.PAYLOAD_TOO_LARGE,
                    "El total de las fotos supera los 15 MB");
        }
        return out;
    }

    private Duenio crearDuenioPendiente(Integer personaId) {
        Integer numeroPais = clienteRepo.findById(personaId)
                .map(Cliente::getNumeroPais).orElse(null);
        Duenio d = new Duenio();
        d.setIdentificador(personaId);
        d.setNumeroPais(numeroPais);
        d.setVerificacionFinanciera("no");
        d.setVerificacionJudicial("no");
        d.setCalificacionRiesgo(null);
        d.setVerificador(primerEmpleado());
        return duenioRepo.save(d);
    }

    private Integer primerEmpleado() {
        return empleadoRepo.findAll().stream().findFirst().map(Empleado::getIdentificador)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                        ErrorCodes.INTERNAL_ERROR, "No hay empleados para asignar como revisor"));
    }

    private static String blankToFallback(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback.length() > 300 ? fallback.substring(0, 300) : fallback;
        }
        return value;
    }

    private static String emptyToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private ProductoDto toDto(Producto pr) {
        return new ProductoDto(pr.getIdentificador(), pr.getDescripcionCatalogo(),
                pr.getDescripcionCompleta(), pr.getEstado(), pr.getDisponible(),
                pr.getNombreArtista(), pr.getSeguro());
    }

    private Producto requireOwned(Integer id) {
        AuthPrincipal principal = CurrentUser.get();
        Producto producto = productoRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PRODUCTO_NOT_FOUND, "Producto no encontrado"));
        if (!producto.getDuenio().equals(principal.personaId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER_OF_PRODUCTO, "Este producto no es tuyo");
        }
        return producto;
    }
}
