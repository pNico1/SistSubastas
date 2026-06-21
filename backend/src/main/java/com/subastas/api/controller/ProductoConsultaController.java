package com.subastas.api.controller;

import com.subastas.api.dto.FotoProductoDto;
import com.subastas.api.dto.ProductoDetalleDto;
import com.subastas.api.service.ProductoConsultaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoConsultaController {
    private final ProductoConsultaService service;

    public ProductoConsultaController(ProductoConsultaService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ProductoDetalleDto getProductoById(@PathVariable Integer id) {
        return service.getProductoById(id);
    }

    @GetMapping("/{id}/fotos")
    public List<FotoProductoDto> getFotosProducto(@PathVariable Integer id) {
        return service.getFotosProducto(id);
    }

    @GetMapping
    public List<ProductoDetalleDto> filterProductos(@RequestParam(required = false) String disponible,
                                                    @RequestParam(required = false) Integer duenio) {
        return service.filterProductos(disponible, duenio);
    }
}
