package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.CuentaCobro;
import com.subastas.api.dto.CuentaCobroRequest;
import com.subastas.api.dto.CuentaCobroResponse;
import com.subastas.api.repository.CuentaCobroRepository;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CuentaCobroService {
    private final CuentaCobroRepository repo;
    public CuentaCobroService(CuentaCobroRepository repo) { this.repo = repo; }

    public List<CuentaCobroResponse> listar() {
        Integer duenio = CurrentUser.requireCliente().personaId();
        return repo.findByDuenioOrderByFechaDesc(duenio).stream().map(this::toResponse).toList();
    }

    @Transactional
    public CuentaCobroResponse guardar(CuentaCobroRequest req) {
        Integer duenio = CurrentUser.requireCliente().personaId();
        String moneda = req.moneda().trim().toUpperCase();
        if (!List.of("ARS", "USD").contains(moneda)) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "La moneda debe ser ARS o USD");
        }
        repo.findByDuenioOrderByFechaDesc(duenio).stream().filter(c -> "activa".equals(c.getEstado()))
                .forEach(c -> { c.setEstado("inactiva"); repo.save(c); });
        CuentaCobro c = new CuentaCobro();
        c.setDuenio(duenio); c.setTitular(req.titular().trim()); c.setBanco(req.banco().trim());
        c.setIdentificadorBancario(req.identificadorBancario().trim()); c.setMoneda(moneda);
        c.setPais(req.pais().trim()); c.setExterior(Boolean.TRUE.equals(req.exterior()) ? "si" : "no");
        c.setEstado("activa"); c.setFecha(LocalDateTime.now());
        return toResponse(repo.save(c));
    }

    public CuentaCobro requireActiva(Integer duenio) {
        return repo.findFirstByDuenioAndEstadoOrderByFechaDesc(duenio, "activa")
                .orElseThrow(() -> ApiException.conflict(ErrorCodes.CONFLICT,
                        "Tenés que declarar una cuenta de cobro antes de aceptar las condiciones"));
    }

    private CuentaCobroResponse toResponse(CuentaCobro c) {
        return new CuentaCobroResponse(c.getId(), c.getTitular(), c.getBanco(), c.getIdentificadorBancario(),
                c.getMoneda(), c.getPais(), "si".equals(c.getExterior()), c.getEstado());
    }
}
