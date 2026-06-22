package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Notificacion;
import com.subastas.api.dto.NotificacionDto;
import com.subastas.api.repository.NotificacionRepository;
import com.subastas.api.repository.ProductoRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificacionService {

    private final NotificacionRepository repo;
    private final ProductoRepository productoRepo;

    public NotificacionService(NotificacionRepository repo, ProductoRepository productoRepo) {
        this.repo = repo;
        this.productoRepo = productoRepo;
    }

    @Transactional
    public List<NotificacionDto> listar() {
        AuthPrincipal p = CurrentUser.requireCliente();
        sincronizarEstadosProductos(p.personaId());
        return repo.findByClienteOrderByFechaDesc(p.clienteId()).stream()
                .map(n -> new NotificacionDto(n.getId(), n.getTipo(), n.getMensaje(),
                        "si".equals(n.getLeido()), n.getFecha()))
                .toList();
    }

    public void crearParaCliente(Integer cliente, String tipo, String mensaje) {
        if (repo.existsByClienteAndTipo(cliente, tipo)) return;
        Notificacion n = new Notificacion();
        n.setCliente(cliente);
        n.setTipo(tipo);
        n.setMensaje(mensaje);
        n.setLeido("no");
        n.setFecha(LocalDateTime.now());
        repo.save(n);
    }

    private void sincronizarEstadosProductos(Integer duenio) {
        productoRepo.findByDuenio(duenio).forEach(producto -> {
            Integer id = producto.getIdentificador();
            if ("aprobado".equals(producto.getEstado())) {
                crearParaCliente(duenio, "PRODUCTO_ACEPTADO:" + id,
                        "Tu producto fue aceptado. Revisá la subasta asignada, el valor base y las comisiones.");
            } else if ("rechazado".equals(producto.getEstado())) {
                crearParaCliente(duenio, "PRODUCTO_RECHAZADO:" + id,
                        "Tu producto no fue aceptado. Consultá el motivo y los gastos de devolución.");
            }
        });
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
