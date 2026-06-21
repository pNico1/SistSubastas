-- ============================================================================
--  99_subasta_prueba_activa.sql
--  Crea una subasta ACTIVA AHORA para probar el motor temporal (item activo
--  secuencial + cierre por inactividad).
--
--  Reutiliza los productos 100/101/102 (ya 'aprobado' en el seed) y el
--  empleado 2 como responsable del catalogo.
--
--  IMPORTANTE:
--   - El trigger trg_subastas_fecha_* obliga fecha >= hoy+10 dias. Eso es una
--     validacion de CREACION (las subastas se agendan con anticipacion). Para
--     testear HOY hay que sortearlo: este script lo dropea y lo vuelve a crear
--     identico al final. Es solo para entorno de prueba.
--   - La subasta arranca en UTC_TIME() (el backend corre en UTC): el item 1 queda activo durante
--     INACTIVIDAD_SEG (30s por defecto en SubastaTiempoService). Si no pujas
--     dentro de esa ventana, el item se cierra y avanza. Para desarrollar con
--     calma, subi INACTIVIDAD_SEG (p. ej. a 300) en SubastaTiempoService.java.
--
--  Correr con el cliente mysql:
--    mysql -u root -p subastas < database/99_subasta_prueba_activa.sql
-- ============================================================================

-- 1) Sacar el guard de +10 dias para poder insertar fecha = hoy
DROP TRIGGER IF EXISTS trg_subastas_fecha_ins;
DROP TRIGGER IF EXISTS trg_subastas_fecha_upd;

-- 2) Limpieza idempotente (por si se corre de nuevo)
DELETE FROM pujosDatos WHERE pujo IN (SELECT identificador FROM pujos WHERE item IN (21,22,23));
DELETE FROM pujos                WHERE item IN (21,22,23);
DELETE FROM registroDeSubastaDatos WHERE registro IN (SELECT identificador FROM registroDeSubasta WHERE subasta = 60);
DELETE FROM registroDeSubasta    WHERE subasta = 60;
DELETE FROM asistentes           WHERE subasta = 60;
DELETE FROM itemsCatalogo        WHERE identificador IN (21,22,23);
DELETE FROM catalogos            WHERE identificador = 20;
DELETE FROM subastasDatos        WHERE subasta = 60;
DELETE FROM subastas             WHERE identificador = 60;

-- (opcional) cerrar la subasta 50 del seed para que 60 sea la unica abierta,
-- asi no choca con la regla "no podes estar en mas de una subasta abierta".
-- Descomenta si la necesitas:
-- UPDATE subastas SET estado = 'carrada' WHERE identificador = 50;

-- 3) Subasta que arranca AHORA
INSERT INTO subastas
    (identificador, fecha, hora, estado, subastador, ubicacion,
     capacidadAsistentes, tieneDeposito, seguridadPropia, categoria)
-- UTC_DATE()/UTC_TIME(): el backend corre en UTC, asi el inicio coincide con su reloj.
VALUES
    (60, UTC_DATE(), UTC_TIME(), 'abierta', NULL, 'Sala de prueba',
     100, 'si', 'si', 'comun');

-- moneda (tabla satelite)
INSERT INTO subastasDatos (subasta, moneda) VALUES (60, 'ARS');

-- 4) Catalogo + items (reutiliza productos ya aprobados del seed)
INSERT INTO catalogos (identificador, descripcion, subasta, responsable)
VALUES (20, 'Catalogo de prueba (motor temporal)', 60, 2);

INSERT INTO itemsCatalogo (identificador, catalogo, producto, precioBase, comision, subastado) VALUES
    (21, 20, 100, 1000.00,  100.00,  'no'),
    (22, 20, 101, 5000.00,  500.00,  'no'),
    (23, 20, 102, 20000.00, 2000.00, 'no');

-- 5) Recrear los triggers tal cual el schema original
DELIMITER $$

CREATE TRIGGER trg_subastas_fecha_ins BEFORE INSERT ON subastas
FOR EACH ROW
BEGIN
    IF NEW.fecha IS NOT NULL AND NEW.fecha <= DATE_ADD(CURDATE(), INTERVAL 10 DAY) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La subasta debe crearse con al menos 10 dias de anticipacion';
    END IF;
END$$

CREATE TRIGGER trg_subastas_fecha_upd BEFORE UPDATE ON subastas
FOR EACH ROW
BEGIN
    IF NEW.fecha IS NOT NULL AND NEW.fecha <> OLD.fecha
       AND NEW.fecha <= DATE_ADD(CURDATE(), INTERVAL 10 DAY) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La subasta debe crearse con al menos 10 dias de anticipacion';
    END IF;
END$$

DELIMITER ;

-- 6) Verificacion
SELECT identificador, fecha, hora, estado, categoria FROM subastas WHERE identificador = 60;
SELECT identificador, catalogo, producto, precioBase, subastado FROM itemsCatalogo WHERE catalogo = 20;
