package com.subastas.api.controller;
import com.subastas.api.dto.*;
import com.subastas.api.service.CuentaCobroService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/clientes/me/cuentas-cobro")
public class CuentaCobroController {
    private final CuentaCobroService service;
    public CuentaCobroController(CuentaCobroService service) { this.service = service; }
    @GetMapping public List<CuentaCobroResponse> listar() { return service.listar(); }
    @PostMapping public ResponseEntity<CuentaCobroResponse> guardar(@Valid @RequestBody CuentaCobroRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.guardar(req));
    }
}
