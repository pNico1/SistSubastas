package com.subastas.api.repository;
import com.subastas.api.domain.LiquidacionVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface LiquidacionVentaRepository extends JpaRepository<LiquidacionVenta, Integer> {
    List<LiquidacionVenta> findByDuenioOrderByFechaGeneradaDesc(Integer duenio);
    Optional<LiquidacionVenta> findByProducto(Integer producto);
    Optional<LiquidacionVenta> findByAdquisicion(Integer adquisicion);
}
