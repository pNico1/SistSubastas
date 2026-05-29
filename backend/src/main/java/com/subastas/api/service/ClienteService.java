package com.subastas.api.service;

import com.subastas.api.common.ApiException;
import com.subastas.api.common.ErrorCodes;
import com.subastas.api.domain.Cliente;
import com.subastas.api.domain.Persona;
import com.subastas.api.dto.ClienteProfileDto;
import com.subastas.api.repository.ClienteRepository;
import com.subastas.api.repository.PaisRepository;
import com.subastas.api.repository.PersonaRepository;
import com.subastas.api.security.AuthPrincipal;
import com.subastas.api.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepo;
    private final PersonaRepository personaRepo;
    private final PaisRepository paisRepo;

    public ClienteService(ClienteRepository clienteRepo, PersonaRepository personaRepo,
                          PaisRepository paisRepo) {
        this.clienteRepo = clienteRepo;
        this.personaRepo = personaRepo;
        this.paisRepo = paisRepo;
    }

    public ClienteProfileDto getMyProfile() {
        AuthPrincipal p = CurrentUser.requireCliente();
        Cliente c = clienteRepo.findById(p.clienteId())
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CLIENTE_NOT_FOUND, "Cliente no encontrado"));
        Persona persona = personaRepo.findById(p.personaId()).orElse(null);
        ClienteProfileDto.PaisRef paisRef = (c.getNumeroPais() == null) ? null
                : paisRepo.findById(c.getNumeroPais())
                    .map(pa -> new ClienteProfileDto.PaisRef(pa.getNumero(), pa.getNombre()))
                    .orElse(null);
        return new ClienteProfileDto(
                c.getIdentificador(),
                persona != null ? persona.getNombre() : null,
                persona != null ? persona.getApellido() : null,
                c.getCategoria(),
                c.getAdmitido(),
                paisRef);
    }

    public Map<String, String> getCategory() {
        AuthPrincipal p = CurrentUser.requireCliente();
        Cliente c = clienteRepo.findById(p.clienteId())
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CLIENTE_NOT_FOUND, "Cliente no encontrado"));
        return Map.of("categoriaActual", c.getCategoria());
    }

    public Map<String, Object> getVerificacion() {
        AuthPrincipal p = CurrentUser.requireCliente();
        Cliente c = clienteRepo.findById(p.clienteId())
                .orElseThrow(() -> ApiException.notFound(ErrorCodes.CLIENTE_NOT_FOUND, "Cliente no encontrado"));
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("estado", "si".equals(c.getAdmitido()) ? "aprobado" : "pendiente");
        res.put("nivel", "si".equals(c.getAdmitido()) ? "completo" : "parcial");
        res.put("observaciones", "si".equals(c.getAdmitido()) ? "sin novedades" : "en proceso de verificacion");
        return res;
    }
}
