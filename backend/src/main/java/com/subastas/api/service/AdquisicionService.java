package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Producto;
import com.subastas.api.domain.RegistroDeSubasta;
import com.subastas.api.dto.AdquisicionDto;
import com.subastas.api.repository.ProductoRepository;
import com.subastas.api.repository.RegistroDeSubastaRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdquisicionService {

    private final RegistroDeSubastaRepository rdsRepo;
    private final ProductoRepository productoRepo;

    public AdquisicionService(RegistroDeSubastaRepository rdsRepo, ProductoRepository productoRepo) {
        this.rdsRepo = rdsRepo;
        this.productoRepo = productoRepo;
    }

    public List<AdquisicionDto> listar(String estado) {
        AuthPrincipal p = CurrentUser.requireCliente();
        List<RegistroDeSubasta> regs = (estado != null)
                ? rdsRepo.findByClienteAndEstado(p.clienteId(), estado)
                : rdsRepo.findByCliente(p.clienteId());
        return regs.stream().map(this::toDto).toList();
    }

    public AdquisicionDto getById(Integer id) {
        AuthPrincipal p = CurrentUser.requireCliente();
        RegistroDeSubasta r = rdsRepo.findById(id)
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.NOT_FOUND, "Adquisicion no encontrada"));
        if (!r.getCliente().equals(p.clienteId())) {
            throw ApiException.forbidden(ErrorCodes.FORBIDDEN, "Esta adquisicion no es tuya");
        }
        return toDto(r);
    }

    private AdquisicionDto toDto(RegistroDeSubasta r) {
        String desc = productoRepo.findById(r.getProducto())
                .map(Producto::getDescripcionCatalogo).orElse(null);
        return new AdquisicionDto(r.getIdentificador(), r.getProducto(), desc,
                r.getImporte(), r.getComision(), r.getEstado(), r.getFecha());
    }
}
