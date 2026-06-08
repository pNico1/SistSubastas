package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.MedioPago;
import com.subastas.api.dto.CreateMetodoPagoRequest;
import com.subastas.api.dto.MetodoPagoDto;
import com.subastas.api.repository.MedioPagoRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MetodoPagoService {

    private final MedioPagoRepository repo;

    public MetodoPagoService(MedioPagoRepository repo) {
        this.repo = repo;
    }

    public List<MetodoPagoDto> listar() {
        AuthPrincipal p = CurrentUser.requireCliente();
        return repo.findByCliente(p.clienteId()).stream().map(this::toDto).toList();
    }

    public MetodoPagoDto getById(Integer id) {
        AuthPrincipal p = CurrentUser.requireCliente();
        MedioPago m = repo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PAYMENT_METHOD_NOT_FOUND, "Medio de pago no encontrado"));
        if (!m.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER, "Este medio de pago no es tuyo");
        }
        return toDto(m);
    }

    public MetodoPagoDto crear(CreateMetodoPagoRequest req) {
        AuthPrincipal p = CurrentUser.requireCliente();
        String tipo = normalize(req.tipo());
        if (!List.of("tarjeta", "cuenta_bancaria", "cheque").contains(tipo)) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "Tipo de medio de pago invalido");
        }

        validateByType(tipo, req);

        MedioPago m = new MedioPago();
        m.setCliente(p.clienteId());
        m.setTipo(tipo);
        m.setMarca(resolveMarca(tipo, req));
        m.setBanco(trim(req.banco()));
        m.setCbu(resolveCbu(tipo, req));
        m.setTitular(trim(req.titular()));
        m.setMoneda(resolveMoneda(req.moneda()));
        m.setEsInternacional(Boolean.TRUE.equals(req.esInternacional()) ? "si" : "no");
        m.setMontoGarantia(req.montoGarantia());
        String numero = digits(req.numero());
        if (numero.length() >= 4) {
            m.setUltimos4(numero.substring(numero.length() - 4));
        }
        m.setEstado("pending");   // queda pendiente de verificacion por la empresa
        m.setFechaCreacion(LocalDateTime.now());
        return toDto(repo.save(m));
    }

    public void eliminar(Integer id) {
        AuthPrincipal p = CurrentUser.requireCliente();
        MedioPago m = repo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PAYMENT_METHOD_NOT_FOUND, "Medio de pago no encontrado"));
        if (!m.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER, "Este medio de pago no es tuyo");
        }
        repo.delete(m);
    }

    private MetodoPagoDto toDto(MedioPago m) {
        return new MetodoPagoDto(m.getId(), m.getTipo(), m.getMarca(), m.getBanco(),
                m.getUltimos4(), m.getCbu(), m.getTitular(), m.getMoneda(), m.getEstado());
    }

    private void validateByType(String tipo, CreateMetodoPagoRequest req) {
        if ("tarjeta".equals(tipo)) {
            require(req.titular(), "El titular es obligatorio");
            String numero = digits(req.numero());
            if (numero.length() < 12 || numero.length() > 19) {
                throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "Numero de tarjeta invalido");
            }
            validarVencimientoTarjeta(req.vencimiento());
            String cvv = digits(req.codigoSeguridad());
            if (cvv.length() < 3 || cvv.length() > 4) {
                throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "Codigo de seguridad invalido");
            }
            return;
        }

        if ("cuenta_bancaria".equals(tipo)) {
            require(req.titular(), "El titular es obligatorio");
            require(req.banco(), "El banco es obligatorio");
            String cuenta = firstNonBlank(req.cbu(), req.alias(), req.numero());
            require(cuenta, "CBU, CVU o alias es obligatorio");
            require(req.tipoCuenta(), "El tipo de cuenta es obligatorio");
            require(req.documento(), "DNI, CUIT o CUIL es obligatorio");
            require(req.email(), "El email es obligatorio");
            require(req.telefono(), "El telefono es obligatorio");
            return;
        }

        if ("cheque".equals(tipo)) {
            require(req.banco(), "El banco emisor es obligatorio");
            require(req.numero(), "El numero de cheque es obligatorio");
            require(req.sucursal(), "La sucursal es obligatoria");
            require(req.fechaEmision(), "La fecha de emision es obligatoria");
            validarFechaEmisionCheque(req.fechaEmision());
        }
    }

    private String resolveMarca(String tipo, CreateMetodoPagoRequest req) {
        if (!"tarjeta".equals(tipo)) return trim(req.marca());
        String explicit = trim(req.marca());
        if (explicit != null && !explicit.isBlank()) return explicit;
        String numero = digits(req.numero());
        if (numero.startsWith("4")) return "VISA";
        if (numero.startsWith("5") || numero.startsWith("2")) return "MASTERCARD";
        if (numero.startsWith("34") || numero.startsWith("37")) return "AMEX";
        return "TARJETA";
    }

    private String resolveCbu(String tipo, CreateMetodoPagoRequest req) {
        if (!"cuenta_bancaria".equals(tipo)) return trim(req.cbu());
        return firstNonBlank(req.cbu(), req.alias(), req.numero());
    }

    private String resolveMoneda(String moneda) {
        String normalized = normalize(moneda);
        String resolved = normalized == null || normalized.isBlank() ? "ARS" : normalized.toUpperCase();
        if (!List.of("ARS", "USD").contains(resolved)) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "La moneda debe ser ARS o USD");
        }
        return resolved;
    }

    private void require(String value, String message) {
        if (value == null || value.isBlank()) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, message);
        }
    }

    private boolean matches(String value, String regex) {
        return value != null && value.trim().matches(regex);
    }

    // Vencimiento de tarjeta: formato MM/AA, mes 01-12 y que no este vencida.
    private void validarVencimientoTarjeta(String vto) {
        String v = vto == null ? "" : vto.trim();
        if (!v.matches("\\d{2}/\\d{2}")) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "El vencimiento debe tener formato MM/AA");
        }
        int mes = Integer.parseInt(v.substring(0, 2));
        int anio = 2000 + Integer.parseInt(v.substring(3, 5));
        if (mes < 1 || mes > 12) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "El mes del vencimiento debe estar entre 01 y 12");
        }
        if (java.time.YearMonth.of(anio, mes).isBefore(java.time.YearMonth.now())) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "La tarjeta esta vencida");
        }
    }

    // Fecha de emision de cheque: formato DD/MM/AAAA, fecha real y no futura.
    private void validarFechaEmisionCheque(String fecha) {
        String f = fecha == null ? "" : fecha.trim();
        if (!f.matches("\\d{2}/\\d{2}/\\d{4}")) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "La fecha de emision debe tener formato DD/MM/AAAA");
        }
        int dia = Integer.parseInt(f.substring(0, 2));
        int mes = Integer.parseInt(f.substring(3, 5));
        int anio = Integer.parseInt(f.substring(6, 10));
        java.time.LocalDate emision;
        try {
            emision = java.time.LocalDate.of(anio, mes, dia);
        } catch (java.time.DateTimeException e) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "La fecha de emision no es una fecha valida");
        }
        if (emision.isAfter(java.time.LocalDate.now())) {
            throw ApiException.unprocessable(ErrorCodes.VALIDATION_ERROR, "La fecha de emision no puede ser futura");
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}
