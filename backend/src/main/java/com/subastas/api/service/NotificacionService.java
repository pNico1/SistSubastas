package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Notificacion;
import com.subastas.api.dto.NotificacionDto;
import com.subastas.api.repository.NotificacionRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificacionService {

    private final NotificacionRepository repo;

    public NotificacionService(NotificacionRepository repo) {
        this.repo = repo;
    }

    public List<NotificacionDto> listar() {
        AuthPrincipal p = CurrentUser.requireCliente();
        return repo.findByClienteOrderByFechaDesc(p.clienteId()).stream()
                .map(n -> new NotificacionDto(n.getId(), n.getTipo(), n.getMensaje(),
                        "si".equals(n.getLeido()), n.getFecha()))
                .toList();
    }

    public void marcarLeida(Integer id) {
        AuthPrincipal p = CurrentUser.requireCliente();
        Notificacion n = repo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Notificacion no encontrada"));
        if (!n.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.FORBIDDEN, "No es tu notificacion");
        }
        n.setLeido("si");
        repo.save(n);
    }
}
