-- ============================================================================
--  99_cleanup_subasta_prueba_activa.sql
--  Borra los datos generados por database/99_subasta_prueba_activa.sql.
--
--  Es idempotente: se puede ejecutar varias veces.
--  Limpia tambien datos que pudo generar el motor temporal mientras probabas:
--  pujas, ventas, compras de empresa, facturas, entregas, pagos, multas y
--  liquidaciones relacionadas con la subasta 60.
--
--  Correr con el cliente mysql:
--    mysql -u root -p subastas < database/99_cleanup_subasta_prueba_activa.sql
-- ============================================================================

USE subastas;

SET SQL_SAFE_UPDATES = 0;

SET @subasta_prueba = 60;
SET @catalogo_prueba = 20;

DROP TEMPORARY TABLE IF EXISTS tmp_items_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_productos_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_adquisiciones_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_compras_empresa_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_multas_prueba;

-- IDs derivados de la subasta/catalogo de prueba.
CREATE TEMPORARY TABLE tmp_items_prueba AS
SELECT identificador AS item
FROM itemsCatalogo
WHERE catalogo = @catalogo_prueba
   OR identificador IN (21, 22, 23);

CREATE TEMPORARY TABLE tmp_productos_prueba AS
SELECT producto
FROM itemsCatalogo
WHERE catalogo = @catalogo_prueba
   OR identificador IN (21, 22, 23)
UNION
SELECT 100 UNION SELECT 101 UNION SELECT 102;

CREATE TEMPORARY TABLE tmp_adquisiciones_prueba AS
SELECT identificador AS adquisicion
FROM registroDeSubasta
WHERE subasta = @subasta_prueba;

CREATE TEMPORARY TABLE tmp_compras_empresa_prueba AS
SELECT id AS compraEmpresa
FROM comprasEmpresa
WHERE subasta = @subasta_prueba;

CREATE TEMPORARY TABLE tmp_multas_prueba AS
SELECT id AS multa
FROM multas
WHERE adquisicion IN (SELECT adquisicion FROM tmp_adquisiciones_prueba);

-- Dependencias de pagos/multas/adquisiciones.
DELETE FROM pagos
WHERE adquisicion IN (SELECT adquisicion FROM tmp_adquisiciones_prueba)
   OR multa IN (SELECT multa FROM tmp_multas_prueba);

DELETE FROM multas
WHERE id IN (SELECT multa FROM tmp_multas_prueba);

DELETE FROM facturas
WHERE adquisicion IN (SELECT adquisicion FROM tmp_adquisiciones_prueba);

DELETE FROM entregas
WHERE adquisicion IN (SELECT adquisicion FROM tmp_adquisiciones_prueba);

DELETE FROM liquidacionesVenta
WHERE adquisicion IN (SELECT adquisicion FROM tmp_adquisiciones_prueba)
   OR compraEmpresa IN (SELECT compraEmpresa FROM tmp_compras_empresa_prueba)
   OR producto IN (SELECT producto FROM tmp_productos_prueba);

DELETE FROM registroDeSubastaDatos
WHERE registro IN (SELECT adquisicion FROM tmp_adquisiciones_prueba);

DELETE FROM registroDeSubasta
WHERE identificador IN (SELECT adquisicion FROM tmp_adquisiciones_prueba);

DELETE FROM comprasEmpresa
WHERE id IN (SELECT compraEmpresa FROM tmp_compras_empresa_prueba);

-- Pujas y asistentes.
DELETE FROM pujosDatos
WHERE pujo IN (
    SELECT identificador
    FROM pujos
    WHERE item IN (SELECT item FROM tmp_items_prueba)
);

DELETE FROM pujos
WHERE item IN (SELECT item FROM tmp_items_prueba);

DELETE FROM asistentes
WHERE subasta = @subasta_prueba;

-- Catalogo, subasta y datos satelite.
DELETE FROM itemsCatalogo
WHERE identificador IN (SELECT item FROM tmp_items_prueba)
   OR catalogo = @catalogo_prueba;

DELETE FROM catalogos
WHERE identificador = @catalogo_prueba
   OR subasta = @subasta_prueba;

DELETE FROM subastasDatos
WHERE subasta = @subasta_prueba;

DELETE FROM subastas
WHERE identificador = @subasta_prueba;

-- Restaurar productos reutilizados por el script de prueba.
UPDATE productos
SET disponible = 'si'
WHERE identificador IN (100, 101, 102);

UPDATE productosDatos
SET estado = 'aprobado',
    terminosAceptados = COALESCE(terminosAceptados, 'si')
WHERE producto IN (100, 101, 102);

DROP TEMPORARY TABLE IF EXISTS tmp_items_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_productos_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_adquisiciones_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_compras_empresa_prueba;
DROP TEMPORARY TABLE IF EXISTS tmp_multas_prueba;

SET SQL_SAFE_UPDATES = 1;

SELECT 'cleanup_subasta_prueba_activa_ok' AS resultado;
