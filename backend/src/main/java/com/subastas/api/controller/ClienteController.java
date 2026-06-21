package com.subastas.api.controller;

import com.subastas.api.dto.ClienteProfileDto;
import com.subastas.api.dto.UpdateMyClientRequest;
import com.subastas.api.service.ClienteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@RestController
@RequestMapping("/api/clientes/me")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public ClienteProfileDto perfil() {
        return clienteService.getMyProfile();
    }

    @PutMapping
    public ClienteProfileDto updateMyClient(@Valid @RequestBody UpdateMyClientRequest request) {
        return clienteService.updateMyClient(request);
    }

    @GetMapping("/category")
    public Map<String, String> categoria() {
        return clienteService.getCategory();
    }

    @GetMapping("/verificacion")
    public Map<String, Object> verificacion() {
        return clienteService.getVerificacion();
    }
}
