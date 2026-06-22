package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.common.dto.MessageResponse;
import com.subastas.api.domain.MedioPago;
import com.subastas.api.domain.Multa;
import com.subastas.api.domain.Pago;
import com.subastas.api.dto.MultaDto;
import com.subastas.api.dto.PagoMultaRequest;
import com.subastas.api.repository.MedioPagoRepository;
import com.subastas.api.repository.MultaRepository;
import com.subastas.api.repository.PagoRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@Service
public class MultaService {

    private final MultaRepository repo;
    private final MedioPagoRepository medioPagoRepo;
    private final PagoRepository pagoRepo;
    private final RegistroDeSubastaRepository registroRepo;
    private final NotificacionService notificacionService;

    public MultaService(MultaRepository repo, MedioPagoRepository medioPagoRepo, PagoRepository pagoRepo,
                        RegistroDeSubastaRepository registroRepo, NotificacionService notificacionService) {
        this.repo = repo;
        this.medioPagoRepo = medioPagoRepo;
        this.pagoRepo = pagoRepo;
        this.registroRepo = registroRepo;
        this.notificacionService = notificacionService;
    }

    public List<MultaDto> listar() {
        AuthPrincipal p = CurrentUser.requireCliente();
        return repo.findByCliente(p.clienteId()).stream()
                .map(m -> new MultaDto(m.getId(), m.getImporte(), m.getEstado(), m.getFechaLimite()))
                .toList();
    }

    public MultaDto getById(Integer id) {
        Multa m = requireOwned(id);
        return new MultaDto(m.getId(), m.getImporte(), m.getEstado(), m.getFechaLimite());
    }

    @Transactional
    public MessageResponse pagar(Integer id, PagoMultaRequest req) {
        AuthPrincipal p = CurrentUser.requireCliente();
        Multa m = requireOwned(id);

        if ("paid".equals(m.getEstado())) {
            throw ApiException.conflict(ErrorCodes.MULTA_ALREADY_PAID, "La multa ya fue pagada");
        }

        Integer medioId = (req == null) ? null : req.paymentMethodId();
        if (medioId == null) {
            throw ApiException.badRequest(ErrorCodes.INVALID_DATA, "Falta el medio de pago");
        }
        MedioPago medio = medioPagoRepo.findById(medioId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.PAYMENT_METHOD_NOT_FOUND, "Medio de pago no encontrado"));
        if (!medio.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.NOT_OWNER, "El medio de pago no es tuyo");
        }
        if (!"verified".equals(medio.getEstado())) {
            throw ApiException.unprocessable(ErrorCodes.PAYMENT_METHOD_NOT_VERIFIED, "El medio de pago no esta verificado");
        }

        Pago pago = new Pago();
        pago.setMulta(id);
        pago.setMedioPago(medio.getId());
        pago.setImporteTotal(m.getImporte());
        pago.setMoneda(medio.getMoneda() != null ? medio.getMoneda() : "ARS");
        pago.setEstado("pagado");
        pago.setFechaPago(LocalDateTime.now());
        pagoRepo.save(pago);

        m.setEstado("paid");
        repo.save(m);
        notificacionService.crearParaCliente(p.clienteId(), "MULTA_PAGADA:" + id,
                "El pago de la multa fue confirmado. Ya podés volver a participar en subastas.");
        return MessageResponse.of("Multa pagada correctamente");
    }

    @Transactional
    public MultaDto declararFaltaFondos(Integer adquisicionId) {
        AuthPrincipal p = CurrentUser.requireCliente();
        var adquisicion = registroRepo.findById(adquisicionId)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.ADQUISICION_NOT_FOUND,
                        "Adquisición no encontrada"));
        if (!adquisicion.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.FORBIDDEN, "Esta adquisición no es tuya");
        }
        if ("pagado".equals(adquisicion.getEstado()) || "entregado".equals(adquisicion.getEstado())) {
            throw ApiException.conflict(ErrorCodes.ADQUISICION_ALREADY_PAID, "La adquisición ya fue pagada");
        }
        Multa existente = repo.findByAdquisicion(adquisicionId).orElse(null);
        if (existente != null) return toDto(existente);

        Multa multa = new Multa();
        multa.setCliente(p.clienteId());
        multa.setAdquisicion(adquisicionId);
        multa.setImporte(adquisicion.getImporte().multiply(new BigDecimal("0.10")));
        multa.setEstado("pending");
        multa.setFechaLimite(LocalDate.now().plusDays(3));
        multa.setFecha(LocalDateTime.now());
        multa = repo.save(multa);

        adquisicion.setEstado("en_mora");
        registroRepo.save(adquisicion);
        notificacionService.crearParaCliente(p.clienteId(), "MULTA:" + multa.getId(),
                "Se generó una multa del 10% de tu oferta. Debés pagarla y presentar los fondos dentro de 72 horas.");
        return toDto(multa);
    }

    private Multa requireOwned(Integer id) {
        AuthPrincipal p = CurrentUser.requireCliente();
        Multa m = repo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.MULTA_NOT_FOUND, "Multa no encontrada"));
        if (!m.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.FORBIDDEN, "Esta multa no es tuya");
        }
        return m;
    }

    private MultaDto toDto(Multa m) {
        return new MultaDto(m.getId(), m.getImporte(), m.getEstado(), m.getFechaLimite());
    }
}
