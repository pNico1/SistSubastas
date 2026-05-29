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
        if (!List.of("tarjeta", "cuenta_bancaria", "cheque").contains(req.tipo())) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "Tipo de medio de pago invalido");
        }
        MedioPago m = new MedioPago();
        m.setCliente(p.clienteId());
        m.setTipo(req.tipo());
        m.setMarca(req.marca());
        m.setBanco(req.banco());
        m.setCbu(req.cbu());
        m.setTitular(req.titular());
        m.setMoneda(req.moneda());
        m.setEsInternacional(Boolean.TRUE.equals(req.esInternacional()) ? "si" : "no");
        m.setMontoGarantia(req.montoGarantia());
        if (req.numero() != null && req.numero().length() >= 4) {
            m.setUltimos4(req.numero().substring(req.numero().length() - 4));
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
}
