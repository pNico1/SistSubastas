-- ============================================================================
--  SEED de datos de prueba - Sistema de Subastas (entrega 2)
--  Pensado para el circuito completo: login -> subastas -> item -> pujar.
--
--  Usuarios de prueba (password para todos: Password123!):
--    juan@email.com    -> cliente categoria 'oro'   (usuario principal de prueba)
--    maria@email.com   -> cliente categoria 'plata' (postor que ya pujo)
--    admin@subastas.com-> empleado/administrador
--
--  El hash BCrypt corresponde a "Password123!" (compatible con Spring Security).
-- ============================================================================

USE subastas;

-- paises ---------------------------------------------------------------------
INSERT INTO paises (numero, nombre, nombreCorto, capital, nacionalidad, idiomas) VALUES
 (1, 'Argentina',      'ARG', 'Buenos Aires', 'Argentina',      'Espanol'),
 (2, 'Brasil',         'BRA', 'Brasilia',     'Brasilena',      'Portugues'),
 (3, 'Estados Unidos', 'USA', 'Washington',   'Estadounidense', 'Ingles');

-- personas (ids explicitos para que los subtipos compartan PK) ----------------
INSERT INTO personas (identificador, documento, nombre, apellido, direccion, estado) VALUES
 (1, '20111111', 'Ana',     'Lopez',  'Calle Falsa 100', 'activo'),
 (2, '20222222', 'Carlos',  'Gomez',  'Av. Central 200', 'activo'),
 (3, '20333333', 'Martin',  'Rea',    'Ruta 8 Km 50',    'activo'),
 (4, '30444444', 'Juan',    'Perez',  'Av. Rivadavia 123','activo'),
 (5, '30555555', 'Maria',   'Garcia', 'San Martin 456',  'activo'),
 (6, '30666666', 'Roberto', 'Diaz',   'Belgrano 789',    'activo');

-- usuarios (auth) ------------------------------------------------------------
INSERT INTO usuarios (persona, email, passwordHash, estadoRegistro) VALUES
 (2, 'admin@subastas.com', '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active'),
 (4, 'juan@email.com',     '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active'),
 (5, 'maria@email.com',    '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active');

-- empleados (sector NULL primero por la FK circular con sectores) ------------
INSERT INTO empleados (identificador, cargo, sector) VALUES
 (1, 'Revisor',        NULL),
 (2, 'Administrador',  NULL);

-- sectores -------------------------------------------------------------------
INSERT INTO sectores (identificador, nombreSector, codigoSector, responsableSector) VALUES
 (1, 'Operaciones', 'OPS', 2);

-- cerrar la FK circular
UPDATE empleados SET sector = 1 WHERE identificador IN (1, 2);

-- subastadores ---------------------------------------------------------------
INSERT INTO subastadores (identificador, matricula, region) VALUES
 (3, 'SUB-22', 'AMBA');

-- clientes -------------------------------------------------------------------
INSERT INTO clientes (identificador, numeroPais, admitido, categoria, verificador) VALUES
 (4, 1, 'si', 'oro',   1),
 (5, 1, 'si', 'plata', 1);

-- duenios --------------------------------------------------------------------
INSERT INTO duenios (identificador, numeroPais, verificacionFinanciera, verificacionJudicial, calificacionRiesgo, verificador) VALUES
 (6, 1, 'si', 'si', 2, 1);

-- seguros --------------------------------------------------------------------
INSERT INTO seguros (nroPoliza, compania, polizaCombinada, importe) VALUES
 ('ABC123', 'Zurich', 'no', 15000.00);

-- productos (del duenio 6, revisados por empleado 1) -------------------------
INSERT INTO productos (identificador, fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro, estado, nombreArtista) VALUES
 (100, '2026-04-01', 'si', 'Reloj Rolex Submariner',  'https://cdn.app.com/docs/prod100.pdf', 1, 6, 'ABC123', 'aprobado', NULL),
 (101, '2026-04-02', 'si', 'Mesa antigua de roble',   'https://cdn.app.com/docs/prod101.pdf', 1, 6, NULL,     'aprobado', NULL),
 (102, '2026-04-03', 'si', 'Oleo "Paisaje del Sur"',  'https://cdn.app.com/docs/prod102.pdf', 1, 6, NULL,     'aprobado', 'E. Pettoruti');

-- fotos (urls de ejemplo) ----------------------------------------------------
INSERT INTO fotos (producto, foto, url, orden) VALUES
 (100, 0x00, 'https://cdn.app.com/img/100_1.jpg', 1),
 (100, 0x00, 'https://cdn.app.com/img/100_2.jpg', 2),
 (101, 0x00, 'https://cdn.app.com/img/101_1.jpg', 1),
 (102, 0x00, 'https://cdn.app.com/img/102_1.jpg', 1);

-- subastas -------------------------------------------------------------------
--  50: PLATA / ARS  -> demo principal (aplican limites 1% y 20%)
--  51: ORO   / USD  -> sin limites de puja
--  52: COMUN / ARS  -> programada (aun no abierta)
INSERT INTO subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadAsistentes, tieneDeposito, seguridadPropia, categoria, moneda) VALUES
 (50, '2026-06-15', '18:00:00', 'abierta',    3, 'Av. Siempre Viva 123', 100, 'si', 'si', 'plata', 'ARS'),
 (51, '2026-06-20', '19:00:00', 'abierta',    3, 'Salon Central 50',     80,  'si', 'no', 'oro',   'USD'),
 (52, '2026-07-01', '17:00:00', 'programada', 3, 'Hall Norte 10',        60,  'no', 'si', 'comun', 'ARS');

-- catalogos ------------------------------------------------------------------
INSERT INTO catalogos (identificador, descripcion, subasta, responsable) VALUES
 (10, 'Catalogo de antiguedades y arte', 50, 2);

-- itemsCatalogo --------------------------------------------------------------
INSERT INTO itemsCatalogo (identificador, catalogo, producto, precioBase, comision, subastado) VALUES
 (1, 10, 100, 1000.00,  100.00, 'no'),
 (2, 10, 101, 5000.00,  500.00, 'no'),
 (3, 10, 102, 20000.00, 2000.00,'no');

-- medios de pago (verificados, para poder pujar) ----------------------------
INSERT INTO mediosPago (cliente, tipo, marca, ultimos4, titular, moneda, esInternacional, estado) VALUES
 (4, 'tarjeta', 'Visa',       '1234', 'Juan Perez',   'ARS', 'no', 'verified'),
 (5, 'tarjeta', 'Mastercard', '5678', 'Maria Garcia', 'ARS', 'no', 'verified');

-- asistentes: Maria (cliente 5) ya esta unida a la subasta 50 ----------------
INSERT INTO asistentes (identificador, numeroPostor, cliente, subasta) VALUES
 (1, 1, 5, 50);

-- pujos: Maria ya pujo 1500 sobre el item 1 (Reloj, base 1000) ---------------
INSERT INTO pujos (asistente, item, importe, ganador, fechaHora) VALUES
 (1, 1, 1500.00, 'no', '2026-05-10 18:32:15');

-- notificacion de ejemplo para Juan ------------------------------------------
INSERT INTO notificaciones (cliente, tipo, mensaje, leido) VALUES
 (4, 'BIENVENIDA', 'Bienvenido a Subastas. Ya podes participar.', 'no');
