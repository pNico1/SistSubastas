-- ============================================================================
--  SEED de datos de prueba - Sistema de Subastas
--  Pensado para el circuito completo: login -> subastas -> item -> pujar.
--
--  Usuarios de prueba (password para todos: Password123!):
--    juan@email.com    -> cliente categoria 'oro'   (usuario principal de prueba)
--    maria@email.com   -> cliente categoria 'plata' (postor que ya pujo)
--    admin@subastas.com-> empleado/administrador
--
--  El hash BCrypt corresponde a "Password123!" (compatible con Spring Security).
--
--  NOTA: los datos propios de la app van en las tablas satelite *Datos
--  (las tablas originales no tienen esas columnas). Las fechas de subastas
--  son relativas a CURDATE() porque el trigger exige +10 dias de anticipacion.
-- ============================================================================

USE subastas;

-- paises ---------------------------------------------------------------------
INSERT INTO paises (numero, nombre, nombreCorto, capital, nacionalidad, idiomas) VALUES
 (1, 'Argentina',      'ARG', 'Buenos Aires', 'Argentina',      'Espanol'),
 (2, 'Brasil',         'BRA', 'Brasilia',     'Brasilena',      'Portugues'),
 (3, 'Estados Unidos', 'USA', 'Washington',   'Estadounidense', 'Ingles');

-- personas (ids explicitos para que los subtipos compartan PK) ----------------
INSERT INTO personas (identificador, documento, nombre, direccion, estado) VALUES
 (1, '20111111', 'Ana',     'Calle Falsa 100',  'activo'),
 (2, '20222222', 'Carlos',  'Av. Central 200',  'activo'),
 (3, '20333333', 'Martin',  'Ruta 8 Km 50',     'activo'),
 (4, '30444444', 'Juan',    'Av. Rivadavia 123','activo'),
 (5, '30555555', 'Maria',   'San Martin 456',   'activo'),
 (6, '30666666', 'Roberto', 'Belgrano 789',     'activo');

-- personasDatos (apellido vive en la tabla satelite) --------------------------
INSERT INTO personasDatos (persona, apellido) VALUES
 (1, 'Lopez'),
 (2, 'Gomez'),
 (3, 'Rea'),
 (4, 'Perez'),
 (5, 'Garcia'),
 (6, 'Diaz');

-- usuarios (auth) ------------------------------------------------------------
INSERT INTO usuarios (persona, email, passwordHash, estadoRegistro) VALUES
 (2, 'admin@subastas.com', '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active'),
 (4, 'juan@email.com',     '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active'),
 (5, 'maria@email.com',    '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active');

-- empleados ------------------------------------------------------------------
INSERT INTO empleados (identificador, cargo, sector) VALUES
 (1, 'Revisor',        NULL),
 (2, 'Administrador',  NULL);

-- sectores -------------------------------------------------------------------
INSERT INTO sectores (identificador, nombreSector, codigoSector, responsableSector) VALUES
 (1, 'Operaciones', 'OPS', 2);

UPDATE empleados SET sector = 1 WHERE identificador IN (1, 2);

-- subastadores ---------------------------------------------------------------
INSERT INTO subastadores (identificador, matricula, region) VALUES
 (3, 'SUB-22', 'AMBA');

-- clientes -------------------------------------------------------------------
INSERT INTO clientes (identificador, numeroPais, admitido, categoria, verificador) VALUES
 (4, 1, 'si', 'oro',   1),
 (5, 1, 'si', 'plata', 1);

-- duenios --------------------------------------------------------------------
INSERT INTO duenios (identificador, numeroPais, `verificaciónFinanciera`, `verificaciónJudicial`, calificacionRiesgo, verificador) VALUES
 (6, 1, 'si', 'si', 2, 1);

-- seguros --------------------------------------------------------------------
INSERT INTO seguros (nroPoliza, compania, polizaCombinada, importe) VALUES
 ('ABC123', 'Zurich', 'no', 15000.00);

-- productos (del duenio 6, revisados por empleado 1) -------------------------
INSERT INTO productos (identificador, fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro) VALUES
 (100, '2026-04-01', 'si', 'Reloj Rolex Submariner',  'https://cdn.app.com/docs/prod100.pdf', 1, 6, 'ABC123'),
 (101, '2026-04-02', 'si', 'Mesa antigua de roble',   'https://cdn.app.com/docs/prod101.pdf', 1, 6, NULL),
 (102, '2026-04-03', 'si', 'Oleo "Paisaje del Sur"',  'https://cdn.app.com/docs/prod102.pdf', 1, 6, NULL);

-- productosDatos (estado del ciclo y datos de obra, en la satelite) -----------
INSERT INTO productosDatos (producto, estado, nombreArtista, terminosAceptados) VALUES
 (100, 'aprobado', NULL,           'si'),
 (101, 'aprobado', NULL,           'si'),
 (102, 'aprobado', 'E. Pettoruti', 'si');

-- fotos (ids explicitos para enlazar la satelite) -----------------------------
INSERT INTO fotos (identificador, producto, foto) VALUES
 (1, 100, 0x00),
 (2, 100, 0x00),
 (3, 101, 0x00),
 (4, 102, 0x00);

-- fotosDatos (url y orden, en la satelite) ------------------------------------
INSERT INTO fotosDatos (foto, url, orden) VALUES
 (1, 'https://cdn.app.com/img/100_1.jpg', 1),
 (2, 'https://cdn.app.com/img/100_2.jpg', 2),
 (3, 'https://cdn.app.com/img/101_1.jpg', 1),
 (4, 'https://cdn.app.com/img/102_1.jpg', 1);

-- subastas --------------------------------------------------------------------
--  50: PLATA -> demo principal (aplican limites 1% y 20%)
--  51: ORO   -> sin limites de puja
--  52: COMUN -> aun sin abrir (estado NULL; el CHECK original solo admite
--               'abierta'/'carrada')
--  Fechas relativas a hoy: el trigger exige > CURDATE() + 10 dias.
INSERT INTO subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadAsistentes, tieneDeposito, seguridadPropia, categoria) VALUES
 (50, DATE_ADD(CURDATE(), INTERVAL 15 DAY), '18:00:00', 'abierta', 3, 'Av. Siempre Viva 123', 100, 'si', 'si', 'plata'),
 (51, DATE_ADD(CURDATE(), INTERVAL 20 DAY), '19:00:00', 'abierta', 3, 'Salon Central 50',     80,  'si', 'no', 'oro'),
 (52, DATE_ADD(CURDATE(), INTERVAL 30 DAY), '17:00:00', NULL,      3, 'Hall Norte 10',        60,  'no', 'si', 'comun');

-- subastasDatos (moneda, en la satelite) --------------------------------------
INSERT INTO subastasDatos (subasta, moneda) VALUES
 (50, 'ARS'),
 (51, 'USD'),
 (52, 'ARS');

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
INSERT INTO pujos (identificador, asistente, item, importe, ganador) VALUES
 (1, 1, 1, 1500.00, 'no');

-- pujosDatos (timestamp de la puja, en la satelite) ---------------------------
INSERT INTO pujosDatos (pujo, fechaHora) VALUES
 (1, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- notificacion de ejemplo para Juan ------------------------------------------
INSERT INTO notificaciones (cliente, tipo, mensaje, leido) VALUES
 (4, 'BIENVENIDA', 'Bienvenido a Subastas. Ya podes participar.', 'no');
