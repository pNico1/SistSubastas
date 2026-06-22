package com.subastas.api.repository;
import com.subastas.api.domain.CuentaCobro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface CuentaCobroRepository extends JpaRepository<CuentaCobro, Integer> {
    List<CuentaCobro> findByDuenioOrderByFechaDesc(Integer duenio);
    Optional<CuentaCobro> findFirstByDuenioAndEstadoOrderByFechaDesc(Integer duenio, String estado);
}
