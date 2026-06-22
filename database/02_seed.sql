-- ============================================================================
--  SEED de datos de prueba - Sistema de Subastas
--  Pensado para recorrer el circuito completo:
--    login -> subastas -> lote -> pujar -> notificaciones -> ventas.
--
--  Usuarios de prueba (password para todos: Password123!):
--    juan@email.com      -> cliente categoria 'oro'
--    maria@email.com     -> cliente categoria 'plata'
--    lucia@email.com     -> cliente categoria 'especial'
--    admin@subastas.com  -> empleado/administrador
--
--  El hash BCrypt corresponde a "Password123!".
--  Las fechas de subastas son relativas a CURDATE() porque el trigger exige
--  mas de 10 dias de anticipacion.
-- ============================================================================

USE subastas;

-- paises ---------------------------------------------------------------------
INSERT INTO paises (numero, nombre, nombreCorto, capital, nacionalidad, idiomas) VALUES
 (1, 'Argentina',      'ARG', 'Buenos Aires', 'Argentina',      'Espanol'),
 (2, 'Brasil',         'BRA', 'Brasilia',     'Brasilena',      'Portugues'),
 (3, 'Estados Unidos', 'USA', 'Washington',   'Estadounidense', 'Ingles'),
 (4, 'Francia',        'FRA', 'Paris',        'Francesa',       'Frances'),
 (5, 'Italia',         'ITA', 'Roma',         'Italiana',       'Italiano');

-- personas -------------------------------------------------------------------
INSERT INTO personas (identificador, documento, nombre, direccion, estado) VALUES
 (1, '20111111', 'Ana',      'Calle Falsa 100',      'activo'),
 (2, '20222222', 'Carlos',   'Av. Central 200',      'activo'),
 (3, '20333333', 'Martin',   'Ruta 8 Km 50',         'activo'),
 (4, '30444444', 'Juan',     'Av. Rivadavia 123',    'activo'),
 (5, '30555555', 'Maria',    'San Martin 456',       'activo'),
 (6, '30666666', 'Roberto',  'Belgrano 789',         'activo'),
 (7, '30777777', 'Lucia',    'Av. Libertador 1440',  'activo'),
 (8, '30888888', 'Elena',    'Defensa 920',          'activo'),
 (9, '30999999', 'Santiago', 'Paraguay 2210',        'activo');

INSERT INTO personasDatos (persona, apellido) VALUES
 (1, 'Lopez'),
 (2, 'Gomez'),
 (3, 'Rea'),
 (4, 'Perez'),
 (5, 'Garcia'),
 (6, 'Diaz'),
 (7, 'Molina'),
 (8, 'Vega'),
 (9, 'Rossi');

-- auth -----------------------------------------------------------------------
INSERT INTO usuarios (persona, email, passwordHash, estadoRegistro, emailVerificado) VALUES
 (2, 'admin@subastas.com', '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active', 'si'),
 (4, 'juan@email.com',     '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active', 'si'),
 (5, 'maria@email.com',    '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active', 'si'),
 (7, 'lucia@email.com',    '$2a$10$UavVCzDbo3u.HRQrKxjI..zKKJ.3jVeXEtpkz0F96FLjJC2Yy9K1K', 'active', 'si');

-- empleados / sectores -------------------------------------------------------
INSERT INTO empleados (identificador, cargo, sector) VALUES
 (1, 'Revisor',       NULL),
 (2, 'Administrador', NULL);

INSERT INTO sectores (identificador, nombreSector, codigoSector, responsableSector) VALUES
 (1, 'Operaciones', 'OPS', 2),
 (2, 'Tasaciones',  'TAS', 1);

UPDATE empleados SET sector = 1 WHERE identificador = 2;
UPDATE empleados SET sector = 2 WHERE identificador = 1;

-- subastadores ---------------------------------------------------------------
INSERT INTO subastadores (identificador, matricula, region) VALUES
 (3, 'SUB-22', 'AMBA');

-- clientes -------------------------------------------------------------------
INSERT INTO clientes (identificador, numeroPais, admitido, categoria, verificador) VALUES
 (4, 1, 'si', 'oro',      1),
 (5, 1, 'si', 'plata',    1),
 (7, 4, 'si', 'especial', 1);

-- duenios --------------------------------------------------------------------
INSERT INTO duenios (identificador, numeroPais, `verificaciónFinanciera`, `verificaciónJudicial`, calificacionRiesgo, verificador) VALUES
 (6, 1, 'si', 'si', 2, 1),
 (8, 5, 'si', 'si', 3, 1),
 (9, 2, 'si', 'si', 2, 1);

-- seguros --------------------------------------------------------------------
INSERT INTO seguros (nroPoliza, compania, polizaCombinada, importe) VALUES
 ('ABC123', 'Zurich',               'no', 15000.00),
 ('ART778', 'Aseguradora Rio Plata','si', 42000.00),
 ('COL555', 'La Caja Arte',         'no', 23000.00),
 ('BRZ909', 'Allianz Objetos Finos', 'no', 18000.00);

-- productos ------------------------------------------------------------------
-- descripcionCompleta se usa como texto breve visible en la app, no como link.
INSERT INTO productos (identificador, fecha, disponible, descripcionCatalogo, descripcionCompleta, revisor, duenio, seguro) VALUES
 (100, '2026-04-01', 'si', 'Reloj Rolex Submariner',
  'Reloj de acero con bisel negro, calendario y brazalete Oyster. Presenta marcas leves de uso y funcionamiento verificado.',
  1, 6, 'ABC123'),
 (101, '2026-04-02', 'si', 'Mesa antigua de roble',
  'Mesa de comedor en roble macizo con patas torneadas y tapa extensible. Conserva patina original y signos normales de epoca.',
  1, 6, NULL),
 (102, '2026-04-03', 'si', 'Oleo Paisaje del Sur',
  'Pintura al oleo sobre tela con montanas, lago y cielo abierto. Marco dorado sencillo y buena presencia decorativa.',
  1, 6, 'ART778'),
 (103, '2026-04-04', 'si', 'Jarron de porcelana azul y blanca',
  'Jarron decorativo de porcelana esmaltada con motivos florales en azul cobalto. Pieza de exhibicion en excelente estado.',
  1, 8, 'COL555'),
 (104, '2026-04-05', 'si', 'Camara Leica I 1927',
  'Camara fotografica de coleccion con cuerpo metalico y terminacion negra. Ideal para vitrina, con lente clasico de 50 mm.',
  1, 8, NULL),
 (105, '2026-04-06', 'si', 'Violin estilo Stradivarius',
  'Violin de estudio avanzado con acabado ambar y estuche rigido. Sonido calido, calibrado recientemente por luthier.',
  1, 8, NULL),
 (106, '2026-04-07', 'si', 'Alfombra persa Heriz',
  'Alfombra anudada a mano con medallon central y guardas geometricas. Colores rojos y azules con desgaste parejo.',
  1, 9, NULL),
 (107, '2026-04-08', 'si', 'Escultura de bronce Art Nouveau',
  'Figura de bronce patinado con base circular y detalles florales. Pieza decorativa pesada, con terminacion envejecida.',
  1, 9, 'BRZ909');

INSERT INTO productosDatos (producto, estado, nombreArtista, fechaObra, historia, terminosAceptados) VALUES
 (100, 'aprobado', NULL, NULL,
  'Ingresado por coleccion particular de relojeria suiza contemporanea.',
  'si'),
 (101, 'aprobado', NULL, 'c. 1920',
  'Procede de una casa familiar de zona norte y fue restaurada de forma conservadora.',
  'si'),
 (102, 'aprobado', 'Atribuido a escuela argentina', 'c. 1965',
  'Obra de taller regional inspirada en paisajes patagonicos.',
  'si'),
 (103, 'aprobado', NULL, 'c. 1950',
  'Pieza ornamental adquirida en lote de decoracion oriental.',
  'si'),
 (104, 'aprobado', 'Leitz', '1927',
  'Camara de coleccion representativa de la primera etapa de Leica.',
  'si'),
 (105, 'aprobado', 'Taller italiano', 'c. 1930',
  'Instrumento con etiqueta interior de inspiracion Cremona.',
  'si'),
 (106, 'aprobado', 'Taller Heriz', 'c. 1900',
  'Textil de lana con dibujo tradicional persa y bordes reforzados.',
  'si'),
 (107, 'aprobado', 'Estilo Auguste Moreau', 'c. 1910',
  'Bronce de salon con lenguaje ornamental de cambio de siglo.',
  'si');

-- fotos ----------------------------------------------------------------------
-- Se guarda 0x00 en la tabla original y la URL real en fotosDatos.
INSERT INTO fotos (identificador, producto, foto) VALUES
 (1, 100, 0x00),
 (2, 101, 0x00),
 (3, 102, 0x00),
 (4, 103, 0x00),
 (5, 104, 0x00),
 (6, 105, 0x00),
 (7, 106, 0x00),
 (8, 107, 0x00);

INSERT INTO fotosDatos (foto, url, orden) VALUES
 (1, 'https://cdn.billowshop.com/57f0dd93-7e22-7738-ef65-bbb21545dbf4/img/Producto/40439df0-926e-146b-5945-8335b20b0692/Reloj3-a-13-66db84eb47253-O.jpg', 1),
 (2, 'https://cloud10.todocoleccion.online/antiguedades/tc/2019/12/20/19/188683905.jpg?size=720x720', 1),
 (3, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Albert_Bierstadt_-_Among_the_Sierra_Nevada%2C_California_-_Google_Art_Project.jpg/330px-Albert_Bierstadt_-_Among_the_Sierra_Nevada%2C_California_-_Google_Art_Project.jpg', 1),
 (4, 'https://openaccess-cdn.clevelandart.org/1986.85/1986.85_web.jpg', 1),
 (5, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/LEI0060_186_Leica_I_Sn.5193_1927_Originalzustand_Front-2_FS-15.jpg/330px-LEI0060_186_Leica_I_Sn.5193_1927_Originalzustand_Front-2_FS-15.jpg', 1),
 (6, 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Stradivarius_violin_front.jpg/250px-Stradivarius_violin_front.jpg', 1),
 (7, 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Antique_Heriz_Serapi_Persian_Carpet.jpg/500px-Antique_Heriz_Serapi_Persian_Carpet.jpg', 1),
 (8, 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Franz_Iffland_Art_Nouveau_Bronze_%281893%29.JPG/250px-Franz_Iffland_Art_Nouveau_Bronze_%281893%29.JPG', 1);

-- subastas -------------------------------------------------------------------
INSERT INTO subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadAsistentes, tieneDeposito, seguridadPropia, categoria) VALUES
 (50, DATE_ADD(CURDATE(), INTERVAL 15 DAY), '18:00:00', 'abierta', 3, 'Av. Siempre Viva 123', 100, 'si', 'si', 'plata'),
 (51, DATE_ADD(CURDATE(), INTERVAL 20 DAY), '19:00:00', 'abierta', 3, 'Salon Central 50',      80, 'si', 'no', 'oro'),
 (52, DATE_ADD(CURDATE(), INTERVAL 30 DAY), '17:00:00', NULL,      3, 'Hall Norte 10',         60, 'no', 'si', 'comun');

INSERT INTO subastasDatos (subasta, moneda) VALUES
 (50, 'ARS'),
 (51, 'USD'),
 (52, 'ARS');

-- catalogos ------------------------------------------------------------------
INSERT INTO catalogos (identificador, descripcion, subasta, responsable) VALUES
 (10, 'Relojes, muebles y arte argentino', 50, 2),
 (11, 'Coleccion internacional premium',   51, 2),
 (12, 'Decoracion y objetos de coleccion', 52, 2);

INSERT INTO itemsCatalogo (identificador, catalogo, producto, precioBase, comision, subastado) VALUES
 (1, 10, 100, 1000000.00, 100000.00, 'no'),
 (2, 10, 101,  250000.00,  25000.00, 'no'),
 (3, 10, 102,  600000.00,  60000.00, 'no'),
 (4, 11, 103,    1800.00,    180.00, 'no'),
 (5, 11, 104,    3200.00,    320.00, 'no'),
 (6, 11, 105,    4500.00,    450.00, 'no'),
 (7, 12, 106,  380000.00,  38000.00, 'no'),
 (8, 12, 107,  520000.00,  52000.00, 'no');

-- medios de pago -------------------------------------------------------------
INSERT INTO mediosPago (cliente, tipo, marca, banco, ultimos4, cbu, titular, moneda, esInternacional, montoGarantia, estado) VALUES
 (4, 'tarjeta', 'Visa',       NULL,             '1234', NULL,                 'Juan Perez',   'ARS', 'no',  5000000.00, 'verified'),
 (4, 'cuenta_bancaria', NULL, 'Banco Nacion',   NULL,   '000000310001234567', 'Juan Perez',   'USD', 'si',    10000.00, 'verified'),
 (5, 'tarjeta', 'Mastercard', NULL,             '5678', NULL,                 'Maria Garcia', 'ARS', 'no',  1500000.00, 'verified'),
 (7, 'tarjeta', 'Amex',       NULL,             '9012', NULL,                 'Lucia Molina', 'ARS', 'no',   900000.00, 'pending');

-- cuentas de cobro para duenios ----------------------------------------------
INSERT INTO cuentasCobroDuenio (duenio, titular, banco, identificadorBancario, moneda, pais, exterior, estado) VALUES
 (6, 'Roberto Diaz',  'Banco Galicia', '0720000188000012345678', 'ARS', 'Argentina', 'no', 'activa'),
 (8, 'Elena Vega',    'Intesa Sanpaolo','IT60X0542811101000000123456', 'USD', 'Italia', 'si', 'activa'),
 (9, 'Santiago Rossi','Banco do Brasil','BR1500000000000010932840814', 'ARS', 'Brasil', 'si', 'activa');

-- asistentes y pujas ---------------------------------------------------------
INSERT INTO asistentes (identificador, numeroPostor, cliente, subasta) VALUES
 (1, 1, 5, 50),
 (2, 2, 4, 50),
 (3, 1, 4, 51),
 (4, 2, 7, 51);

INSERT INTO pujos (identificador, asistente, item, importe, ganador) VALUES
 (1, 1, 1, 1250000.00, 'no'),
 (2, 2, 1, 1400000.00, 'no'),
 (3, 1, 2,  270000.00, 'no'),
 (4, 3, 4,    2100.00, 'no'),
 (5, 4, 5,    3500.00, 'no');

INSERT INTO pujosDatos (pujo, fechaHora) VALUES
 (1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
 (2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
 (3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
 (4, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
 (5, DATE_SUB(NOW(), INTERVAL 6 HOUR));

-- notificaciones -------------------------------------------------------------
INSERT INTO notificaciones (cliente, tipo, mensaje, leido) VALUES
 (4, 'BIENVENIDA', 'Bienvenido a Bidster. Ya podes participar en subastas activas.', 'no'),
 (5, 'PUJA_REGISTRADA', 'Tu ultima puja quedo registrada correctamente.', 'si'),
 (6, 'ENVIO_INSPECCION:100', 'Recibimos el reloj para inspeccion y catalogacion.', 'no'),
 (8, 'PRODUCTO_ACEPTADO:104', 'La camara Leica fue aceptada para subasta.', 'no'),
 (9, 'CUENTA_COBRO_REQUERIDA:107', 'Recorda mantener activa tu cuenta de cobro para liquidaciones.', 'no');
