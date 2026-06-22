-- ============================================================================
--  SETUP COMPLETO - ejecutar este unico archivo en una base nueva
--  Incluye: 01_schema.sql + 02_seed.sql.
--  No incluye 99_subasta_prueba_activa.sql porque es solo para desarrollo.
-- ============================================================================

-- ============================================================================
--  SISTEMA DE SUBASTAS - Esquema MySQL 8 / MariaDB 10.2+
-- ============================================================================
--  Las 16 tablas de EstructuraActual.sql estan TAL CUAL el archivo original:
--  mismas columnas, mismos nombres (incluidos acentos), mismos valores de
--  CHECK (incluidos los typos 'incativo' y 'carrada'). NO se agregaron
--  columnas ni FKs. Todo dato extra que necesita la app vive en tablas
--  aparte (satelites *Datos y tablas nuevas, al final del archivo).
--
--  UNICAS correcciones, todas de sintaxis (ver 03_CAMBIOS.md):
--   [S1] seguros: 'nroPoliza varchar(30) not null.' -> la ',' final.
--   [S2] personas: faltaba ',' antes de la PK.
--   [S3] duenios: faltaba ',' despues de 'verificador'.
--   [S4] asistentes: faltaba ',' despues de 'subasta'.
--   [S5] catalogos: coma sobrante antes del ')'.
--   [T1] T-SQL -> MySQL: identity -> AUTO_INCREMENT, varbinary(max) -> LONGBLOB,
--        sin 'go', FK con columna destino explicita (MySQL la exige).
--   [T2] CHECK de columna sin nombre (MariaDB no admite nombrarlos inline).
--   [T3] chkFecha usaba getdate(): MySQL no admite funciones no deterministas
--        en CHECK. La misma regla se implementa con triggers (al final).
--
--  Este schema ya integra las migraciones incrementales del proyecto
--  (comprasEmpresa, liquidaciones, polizas, notificaciones, origen licito y
--  colecciones). Para crear una base nueva con datos demo, ejecutar solo:
--      database/00_full_setup.sql
-- ============================================================================

DROP DATABASE IF EXISTS subastas;
CREATE DATABASE subastas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE subastas;

-- ====================  TABLAS ORIGINALES (sin modificar)  ===================

create table paises(
    numero int not null,
    nombre varchar(250) not null,
    nombreCorto varchar(250) null,
    capital varchar(250) not null,
    nacionalidad varchar(250) not null,
    idiomas varchar(150) not null,
    constraint pk_paises primary key (numero)
);

create table personas(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    documento varchar(20) not null,
    nombre varchar(150) not null,
    direccion varchar(250),
    estado varchar(15) check (estado in ('activo', 'incativo')),     -- [T2]
    foto LONGBLOB,                                                   -- [T1]
    constraint pk_personas primary key (identificador)               -- [S2]
);

create table empleados(
    identificador int not null,
    cargo varchar(100),
    sector int null,
    constraint pk_empleados primary key (identificador)
);

create table sectores(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    nombreSector varchar(150) not null,
    codigoSector varchar(10) null,
    responsableSector int null,
    constraint pk_sectores primary key (identificador),
    constraint fk_sectores_empleados foreign key (responsableSector) references empleados (identificador)  -- [T1]
);

create table seguros(
    nroPoliza varchar(30) not null,                                  -- [S1]
    compania varchar(150) not null,
    polizaCombinada varchar(2) check(polizaCombinada in ('si','no')),-- [T2]
    importe decimal(18,2) not null check (importe > 0),              -- [T2]
    constraint pk_seguro primary key (nroPoliza)
);

create table clientes(
    identificador int not null,
    numeroPais int,
    admitido varchar(2) check(admitido in ('si','no')),              -- [T2]
    categoria varchar(10) check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino')),  -- [T2]
    verificador int not null,
    constraint pk_clientes primary key (identificador),
    constraint fk_clientes_personas foreign key (identificador) references personas (identificador),  -- [T1]
    constraint fk_clientes_empleados foreign key (verificador) references empleados (identificador),
    constraint fk_clientes_paises foreign key (numeroPais) references paises (numero)
);

create table duenios(
    identificador int not null,
    numeroPais int,
    `verificaciÃ³nFinanciera` varchar(2) check(`verificaciÃ³nFinanciera` in ('si','no')),  -- [T2]
    `verificaciÃ³nJudicial` varchar(2) check(`verificaciÃ³nJudicial` in ('si','no')),      -- [T2]
    calificacionRiesgo int check(calificacionRiesgo in (1,2,3,4,5,6)),                   -- [T2]
    verificador int not null,                                        -- [S3]
    constraint pk_duenios primary key (identificador),
    constraint fk_duenios_personas foreign key (identificador) references personas (identificador),  -- [T1]
    constraint fk_duenios_empleados foreign key (verificador) references empleados (identificador)
);

create table subastadores(
    identificador int not null,
    matricula varchar(15),
    region varchar(50),
    constraint pk_subastadores primary key (identificador),
    constraint fk_subastadores_personas foreign key (identificador) references personas (identificador)  -- [T1]
);

create table subastas(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    -- las subastas tiene al menos 10 dias de anticipacion al momento de crearlas.
    fecha date,                                                      -- [T3] chkFecha -> trigger
    hora time not null,
    estado varchar(10) check (estado in ('abierta','carrada')),      -- [T2]
    subastador int null,
    -- direccion de don de se desarrolla el evento.
    ubicacion varchar(350) null,
    capacidadAsistentes int null,
    -- caracteristica del lugar donde se hacen las subastas
    tieneDeposito varchar(2) check(tieneDeposito in ('si','no')),    -- [T2]
    -- caracteristica del lugar donde se hacen las subastas
    seguridadPropia varchar(2) check(seguridadPropia in ('si','no')),-- [T2]
    categoria varchar(10) check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino')),  -- [T2]
    constraint pk_subastas primary key (identificador),
    constraint fk_subastas_subastadores foreign key (subastador) references subastadores(identificador)
);

create table productos(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    fecha date,
    disponible varchar(2) check (disponible in ('si','no')),         -- [T2]
    -- se obtiene despues que un empleado realiza la revision.
    descripcionCatalogo varchar(500) null default 'No Posee',
    -- url que apunta a un documento PDF firmado que contiene la descripcion del producto.
    descripcionCompleta varchar(300) not null,
    revisor int not null,
    duenio int not null,
    seguro varchar(30) null,
    constraint pk_productos primary key (identificador),
    constraint fk_productos_empleados foreign key (revisor) references empleados(identificador),
    constraint fk_productos_duenios foreign key (duenio) references duenios(identificador)
);

create table fotos(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    producto int not null,
    foto LONGBLOB not null,                                          -- [T1]
    constraint pk_fotos primary key (identificador),
    constraint fk_fotos_productos foreign key (producto) references productos(identificador)
);

create table catalogos(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    descripcion varchar(250) not null,
    subasta int null,
    responsable int not null,
    constraint pk_catalogos primary key (identificador),
    constraint fk_catalogos_empleados foreign key (responsable) references empleados(identificador),
    constraint fk_catalogos_subastas foreign key (subasta) references subastas(identificador)   -- [S5]
);

create table itemsCatalogo(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    catalogo int not null,
    producto int not null,
    precioBase decimal(18,2) not null check (precioBase > 0.01),     -- [T2]
    comision decimal(18,2) not null check (comision > 0.01),         -- [T2]
    subastado varchar(2) check (subastado in ('si','no')),           -- [T2]
    constraint pk_itemsCatalogo primary key (identificador),
    constraint fk_itemsCatalogo_catalogos foreign key (catalogo) references catalogos (identificador),  -- [T1]
    constraint fk_itemsCatalogo_productos foreign key (producto) references productos (identificador)   -- [T1]
);

create table asistentes(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    numeroPostor int not null,
    cliente int not null,
    subasta int not null,                                            -- [S4]
    constraint pk_asistentes primary key (identificador),
    constraint fk_asistentes_clientes foreign key (cliente) references clientes (identificador),  -- [T1]
    constraint fk_asistentes_subasta foreign key (subasta) references subastas (identificador)    -- [T1]
);

create table pujos(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    asistente int not null,
    item int not null,
    importe decimal(18,2) not null check (importe > 0.01),           -- [T2]
    ganador varchar(2) default 'no' check (ganador in ('si','no')),  -- [T2]
    constraint pk_pujos primary key (identificador),
    constraint fk_pujos_asistentes foreign key (asistente) references asistentes (identificador),       -- [T1]
    constraint fk_pujos_itemsCatalogo foreign key (item) references itemsCatalogo (identificador)       -- [T1]
);

create table registroDeSubasta(
    identificador int not null AUTO_INCREMENT,                       -- [T1]
    subasta int not null,
    duenio int not null,
    producto int not null,
    cliente int not null,
    importe decimal(18,2) not null check (importe > 0.01),           -- [T2]
    comision decimal(18,2) not null check (comision > 0.01),         -- [T2]
    constraint pk_registroDeSubasta primary key (identificador),
    constraint fk_registroDeSubasta_subastas foreign key (subasta) references subastas (identificador),   -- [T1]
    constraint fk_registroDeSubasta_duenios foreign key (duenio) references duenios (identificador),      -- [T1]
    constraint fk_registroDeSubasta_producto foreign key (producto) references productos (identificador), -- [T1]
    constraint fk_registroDeSubasta_cliente foreign key (cliente) references clientes (identificador)     -- [T1]
);

-- ==========  TABLAS SATELITE (datos de la app, 1:1 con la original)  ========
--  La PK de cada satelite es a la vez FK a su tabla original.

-- apellido y fotos del documento (registro etapa 1)
CREATE TABLE personasDatos (
    persona       INT          NOT NULL,
    apellido      VARCHAR(150) NULL,
    fotoDocFrente LONGBLOB     NULL,
    fotoDocDorso  LONGBLOB     NULL,
    CONSTRAINT pk_personasDatos PRIMARY KEY (persona),
    CONSTRAINT fk_personasDatos_personas FOREIGN KEY (persona) REFERENCES personas (identificador)
);

-- moneda de la subasta (el TP exige ARS o USD, no bimonetaria)
CREATE TABLE subastasDatos (
    subasta INT        NOT NULL,
    moneda  VARCHAR(3) NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS','USD')),
    CONSTRAINT pk_subastasDatos PRIMARY KEY (subasta),
    CONSTRAINT fk_subastasDatos_subastas FOREIGN KEY (subasta) REFERENCES subastas (identificador)
);

-- ciclo de revision/aceptacion y datos de obras de arte
CREATE TABLE productosDatos (
    producto          INT           NOT NULL,
    estado            VARCHAR(20)   NULL DEFAULT 'en_revision'
        CHECK (estado IN ('en_revision','aprobado','rechazado','aceptado','en_subasta','vendido','devuelto')),
    nombreArtista     VARCHAR(200)  NULL,
    fechaObra         VARCHAR(50)   NULL,
    historia          VARCHAR(1000) NULL,
    terminosAceptados VARCHAR(2)    NULL DEFAULT 'no' CHECK (terminosAceptados IN ('si','no')),
    CONSTRAINT pk_productosDatos PRIMARY KEY (producto),
    CONSTRAINT fk_productosDatos_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

-- url y orden de las fotos (los endpoints las devuelven asi)
CREATE TABLE fotosDatos (
    foto  INT          NOT NULL,
    url   VARCHAR(300) NULL,
    orden INT          NULL,
    CONSTRAINT pk_fotosDatos PRIMARY KEY (foto),
    CONSTRAINT fk_fotosDatos_fotos FOREIGN KEY (foto) REFERENCES fotos (identificador)
);

-- timestamp de la puja (el TP exige respetar el orden de las pujas)
CREATE TABLE pujosDatos (
    pujo      INT      NOT NULL,
    fechaHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pujosDatos PRIMARY KEY (pujo),
    CONSTRAINT fk_pujosDatos_pujos FOREIGN KEY (pujo) REFERENCES pujos (identificador)
);

-- estado y fecha de la adquisicion: pendiente -> pagado -> entregado
CREATE TABLE registroDeSubastaDatos (
    registro INT         NOT NULL,
    estado   VARCHAR(15) NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','pagado','entregado','en_mora')),
    fecha    DATETIME    NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_registroDeSubastaDatos PRIMARY KEY (registro),
    CONSTRAINT fk_rdsDatos_rds FOREIGN KEY (registro) REFERENCES registroDeSubasta (identificador)
);

-- ========================  TABLAS NUEVAS (de la app)  =======================

-- usuarios: credenciales/estado de cuenta para auth (1:1 con personas)
CREATE TABLE usuarios (
    id              INT          NOT NULL AUTO_INCREMENT,
    persona         INT          NOT NULL,
    email           VARCHAR(150) NOT NULL,
    passwordHash    VARCHAR(100) NULL,
    estadoRegistro  VARCHAR(30)  NOT NULL DEFAULT 'pending_verification'
        CHECK (estadoRegistro IN
            ('pending_verification','approved','registration_incomplete','active','suspended')),
    emailVerificado VARCHAR(2)   NOT NULL DEFAULT 'no' CHECK (emailVerificado IN ('si','no')),
    fechaCreacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_persona UNIQUE (persona),
    CONSTRAINT fk_usuarios_personas FOREIGN KEY (persona) REFERENCES personas (identificador)
);

-- tokens: verificacion de registro, refresh y reset de password.
CREATE TABLE tokens (
    id          INT          NOT NULL AUTO_INCREMENT,
    usuario     INT          NOT NULL,
    valor       VARCHAR(200) NOT NULL,
    tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('verification','refresh','reset')),
    expira      DATETIME     NOT NULL,
    usado       VARCHAR(2)   NOT NULL DEFAULT 'no' CHECK (usado IN ('si','no')),
    CONSTRAINT pk_tokens PRIMARY KEY (id),
    CONSTRAINT uq_tokens_valor UNIQUE (valor),
    CONSTRAINT fk_tokens_usuarios FOREIGN KEY (usuario) REFERENCES usuarios (id)
);

-- mediosPago: tarjetas, cuentas bancarias o cheques certificados.
CREATE TABLE mediosPago (
    id              INT          NOT NULL AUTO_INCREMENT,
    cliente         INT          NOT NULL,
    tipo            VARCHAR(20)  NOT NULL CHECK (tipo IN ('tarjeta','cuenta_bancaria','cheque')),
    marca           VARCHAR(50)  NULL,
    banco           VARCHAR(100) NULL,
    ultimos4        VARCHAR(4)   NULL,
    cbu             VARCHAR(30)  NULL,
    titular         VARCHAR(150) NULL,
    moneda          VARCHAR(3)   NULL CHECK (moneda IN ('ARS','USD')),
    esInternacional VARCHAR(2)   NULL DEFAULT 'no' CHECK (esInternacional IN ('si','no')),
    montoGarantia   DECIMAL(18,2) NULL,
    estado          VARCHAR(15)  NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending','verified','rejected')),
    fechaCreacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_mediosPago PRIMARY KEY (id),
    CONSTRAINT fk_mediosPago_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador)
);

-- notificaciones
-- La columna se conserva como 'cliente' por compatibilidad con el codigo,
-- pero referencia personas: tambien se notifican duenios/vendedores.
CREATE TABLE notificaciones (
    id       INT          NOT NULL AUTO_INCREMENT,
    cliente  INT          NOT NULL,
    tipo     VARCHAR(40)  NOT NULL,
    mensaje  VARCHAR(300) NOT NULL,
    leido    VARCHAR(2)   NOT NULL DEFAULT 'no' CHECK (leido IN ('si','no')),
    fecha    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notificaciones PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_personas FOREIGN KEY (cliente) REFERENCES personas (identificador)
);

-- revisiones: ciclo de inspeccion de un producto.
CREATE TABLE revisiones (
    id            INT          NOT NULL AUTO_INCREMENT,
    producto      INT          NOT NULL,
    revisor       INT          NULL,
    estado        VARCHAR(15)  NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
    observaciones VARCHAR(500) NULL,
    motivo        VARCHAR(500) NULL,
    fecha         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_revisiones PRIMARY KEY (id),
    CONSTRAINT fk_revisiones_productos FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_revisiones_empleados FOREIGN KEY (revisor)  REFERENCES empleados (identificador)
);

-- ---- Ãrea 2: dueÃ±o / producto / revisiÃ³n / seguros -------------------------
-- Tablas satÃ©lite: no se agregan columnas a las tablas originales.
CREATE TABLE devoluciones (
    producto           INT           NOT NULL,
    estadoEnvio        VARCHAR(20)   NOT NULL DEFAULT 'preparando'
        CHECK (estadoEnvio IN ('preparando','en_camino','entregado')),
    transportista      VARCHAR(150)  NULL,
    codigoSeguimiento  VARCHAR(100)  NULL,
    costoEnvio         DECIMAL(18,2) NULL CHECK (costoEnvio >= 0),
    moneda             VARCHAR(3)    NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS','USD')),
    direccion          VARCHAR(350)  NULL,
    CONSTRAINT pk_devoluciones PRIMARY KEY (producto),
    CONSTRAINT fk_devoluciones_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

CREATE TABLE solicitudesAumentoSeguro (
    id                   INT           NOT NULL AUTO_INCREMENT,
    producto             INT           NOT NULL,
    nuevoValorAsegurado  DECIMAL(18,2) NOT NULL CHECK (nuevoValorAsegurado > 0),
    estado               VARCHAR(15)   NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','aprobada','rechazada')),
    fecha                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_solicitudesAumentoSeguro PRIMARY KEY (id),
    CONSTRAINT fk_solicitudesAumentoSeguro_productos
        FOREIGN KEY (producto) REFERENCES productos (identificador)
);

CREATE TABLE productoOfertaDatos (
    producto              INT            NOT NULL,
    precioBaseSugerido    DECIMAL(18,2)  NULL CHECK (precioBaseSugerido > 0.01),
    moneda                VARCHAR(3)     NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS','USD')),
    cantidad              INT            NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    origenLicitoDeclarado VARCHAR(2)     NOT NULL DEFAULT 'no' CHECK (origenLicitoDeclarado IN ('si','no')),
    detalleOrigen         VARCHAR(1000)  NULL,
    documentacionOrigen   VARCHAR(500)   NULL,
    estadoOrigen          VARCHAR(15)    NOT NULL DEFAULT 'declarado'
        CHECK (estadoOrigen IN ('declarado','validado','observado')),
    alertaAutoridades     VARCHAR(2)     NOT NULL DEFAULT 'no' CHECK (alertaAutoridades IN ('si','no')),
    motivoAlerta          VARCHAR(500)   NULL,
    fechaAlerta           DATETIME       NULL,
    subastaColeccion      INT            NULL,
    CONSTRAINT pk_productoOfertaDatos PRIMARY KEY (producto),
    CONSTRAINT fk_productoOfertaDatos_productos FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_productoOfertaDatos_subastas FOREIGN KEY (subastaColeccion) REFERENCES subastas (identificador)
);

CREATE TABLE pagosAumentoSeguro (
    id         INT           NOT NULL AUTO_INCREMENT,
    solicitud  INT           NOT NULL,
    importe    DECIMAL(18,2) NOT NULL CHECK (importe >= 0),
    moneda     VARCHAR(3)    NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS','USD')),
    estado     VARCHAR(15)   NOT NULL DEFAULT 'pagado' CHECK (estado IN ('pendiente','pagado')),
    fecha      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pagosAumentoSeguro PRIMARY KEY (id),
    CONSTRAINT uq_pagosAumentoSeguro_solicitud UNIQUE (solicitud),
    CONSTRAINT fk_pagosAumentoSeguro_solicitud
        FOREIGN KEY (solicitud) REFERENCES solicitudesAumentoSeguro (id)
);
-- ---- fin Ãrea 2 -------------------------------------------------------------

-- ---- Cobro del dueÃ±o y liquidaciÃ³n de ventas -------------------------------
CREATE TABLE cuentasCobroDuenio (
    id INT NOT NULL AUTO_INCREMENT, duenio INT NOT NULL, titular VARCHAR(150) NOT NULL,
    banco VARCHAR(150) NOT NULL, identificadorBancario VARCHAR(100) NOT NULL,
    moneda VARCHAR(3) NOT NULL CHECK (moneda IN ('ARS','USD')), pais VARCHAR(100) NOT NULL,
    exterior VARCHAR(2) NOT NULL DEFAULT 'no' CHECK (exterior IN ('si','no')),
    estado VARCHAR(10) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','inactiva')),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_cuentasCobroDuenio PRIMARY KEY (id),
    CONSTRAINT fk_cuentasCobroDuenio_duenio FOREIGN KEY (duenio) REFERENCES personas (identificador)
);

CREATE TABLE liquidacionesVenta (
    id INT NOT NULL AUTO_INCREMENT, producto INT NOT NULL, duenio INT NOT NULL,
    adquisicion INT NULL, compraEmpresa INT NULL, cuentaCobro INT NOT NULL,
    importeBruto DECIMAL(18,2) NOT NULL, comision DECIMAL(18,2) NOT NULL,
    importeNeto DECIMAL(18,2) NOT NULL, moneda VARCHAR(3) NOT NULL CHECK (moneda IN ('ARS','USD')),
    estado VARCHAR(12) NOT NULL CHECK (estado IN ('pendiente','enviada')),
    fechaGenerada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, fechaTransferencia DATETIME NULL,
    CONSTRAINT pk_liquidacionesVenta PRIMARY KEY (id),
    CONSTRAINT uq_liquidacionesVenta_producto UNIQUE (producto),
    CONSTRAINT fk_liquidacionesVenta_producto FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_liquidacionesVenta_duenio FOREIGN KEY (duenio) REFERENCES duenios (identificador),
    CONSTRAINT fk_liquidacionesVenta_adquisicion FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador),
    CONSTRAINT fk_liquidacionesVenta_cuenta FOREIGN KEY (cuentaCobro) REFERENCES cuentasCobroDuenio (id)
);

-- entregas: envio o retiro de una adquisicion.
CREATE TABLE entregas (
    id                INT          NOT NULL AUTO_INCREMENT,
    adquisicion       INT          NOT NULL,
    tipo              VARCHAR(10)  NOT NULL CHECK (tipo IN ('envio','retiro')),
    estado            VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    direccion         VARCHAR(300) NULL,
    codigoRetiro      VARCHAR(20)  NULL,
    transportista     VARCHAR(100) NULL,
    codigoSeguimiento VARCHAR(50)  NULL,
    fechaEstimada     DATE         NULL,
    CONSTRAINT pk_entregas PRIMARY KEY (id),
    CONSTRAINT fk_entregas_rds FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador)
);

-- facturas
CREATE TABLE facturas (
    id            INT           NOT NULL AUTO_INCREMENT,
    adquisicion   INT           NOT NULL,
    numeroFactura VARCHAR(20)   NOT NULL,
    importe       DECIMAL(18,2) NOT NULL,
    comision      DECIMAL(18,2) NOT NULL,
    costoEnvio    DECIMAL(18,2) NULL DEFAULT 0,
    total         DECIMAL(18,2) NOT NULL,
    fecha         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_facturas PRIMARY KEY (id),
    CONSTRAINT uq_facturas_numero UNIQUE (numeroFactura),
    CONSTRAINT fk_facturas_rds FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador)
);

-- multas: 10% por incumplimiento de pago.
CREATE TABLE multas (
    id          INT           NOT NULL AUTO_INCREMENT,
    cliente     INT           NOT NULL,
    adquisicion INT           NULL,
    importe     DECIMAL(18,2) NOT NULL,
    estado      VARCHAR(15)   NOT NULL DEFAULT 'pending' CHECK (estado IN ('pending','paid')),
    fechaLimite DATE          NULL,
    fecha       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_multas PRIMARY KEY (id),
    CONSTRAINT fk_multas_clientes FOREIGN KEY (cliente)     REFERENCES clientes (identificador),
    CONSTRAINT fk_multas_rds      FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador)
);

-- pagos: pago de adquisiciones y de multas.
CREATE TABLE pagos (
    id           INT           NOT NULL AUTO_INCREMENT,
    adquisicion  INT           NULL,
    multa        INT           NULL,
    medioPago    INT           NOT NULL,
    importeTotal DECIMAL(18,2) NOT NULL,
    moneda       VARCHAR(3)    NOT NULL CHECK (moneda IN ('ARS','USD')),
    estado       VARCHAR(15)   NOT NULL DEFAULT 'pagado',
    fechaPago    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pagos PRIMARY KEY (id),
    CONSTRAINT fk_pagos_rds        FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador),
    CONSTRAINT fk_pagos_multas     FOREIGN KEY (multa)       REFERENCES multas (id),
    CONSTRAINT fk_pagos_mediosPago FOREIGN KEY (medioPago)   REFERENCES mediosPago (id)
);

-- comprasEmpresa: piezas sin pujas que, al cerrar el item, compra la empresa al
-- precio base (regla del enunciado). No hay cliente: queda fuera de registroDeSubasta.
CREATE TABLE comprasEmpresa (
    id         INT           NOT NULL AUTO_INCREMENT,
    subasta    INT           NOT NULL,
    producto   INT           NOT NULL,
    duenio     INT           NOT NULL,
    precioBase DECIMAL(18,2) NOT NULL,
    comision   DECIMAL(18,2) NULL,
    fecha      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_comprasEmpresa PRIMARY KEY (id),
    CONSTRAINT uq_comprasEmpresa UNIQUE (subasta, producto),
    CONSTRAINT fk_comprasEmpresa_subasta  FOREIGN KEY (subasta)  REFERENCES subastas (identificador),
    CONSTRAINT fk_comprasEmpresa_producto FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_comprasEmpresa_duenio   FOREIGN KEY (duenio)   REFERENCES duenios (identificador)
);

-- registrosPendientes: registros de postores que AUN NO verificaron su email.
--  No se crea nada en personas/usuarios/clientes hasta que el usuario ingresa el
--  codigo. Cada registro es una fila propia identificada por un 'token' opaco
--  (el registrationId): la verificacion se ata a ESA fila, no al email. Asi, si
--  dos personas usan el mismo email, cada una solo puede completar su propia
--  registracion con el codigo que le corresponde, y no se mezclan datos. No tiene
--  FK a tablas originales (la persona todavia no existe). El codigo se guarda en
--  claro (efimero, 15 min); la clave provisoria se guarda HASHEADA.
CREATE TABLE registrosPendientes (
    id            INT          NOT NULL AUTO_INCREMENT,
    token         VARCHAR(64)  NOT NULL,
    email         VARCHAR(150) NOT NULL,
    documento     VARCHAR(20)  NOT NULL,
    nombre        VARCHAR(150) NOT NULL,
    apellido      VARCHAR(150) NULL,
    direccion     VARCHAR(250) NULL,
    paisOrigen    INT          NOT NULL,
    fotoDocFrente LONGBLOB     NULL,
    fotoDocDorso  LONGBLOB     NULL,
    passwordHash  VARCHAR(100) NOT NULL,
    codigo        VARCHAR(6)   NOT NULL,
    expira        DATETIME     NOT NULL,
    fechaCreacion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_registrosPendientes PRIMARY KEY (id),
    CONSTRAINT uq_registrosPendientes_token UNIQUE (token)
);

-- ====================  TRIGGERS: regla de chkFecha [T3]  ====================
--  Original (T-SQL): check (fecha > dateAdd(dd, 10, getdate()))
--  "las subastas tiene al menos 10 dias de anticipacion al momento de crearlas"
--  En UPDATE solo se valida si cambia la fecha (si no, cerrar una subasta
--  vieja seria imposible).

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

-- Una pÃ³liza combinada solo puede cubrir piezas pertenecientes al mismo dueÃ±o.
CREATE TRIGGER trg_productos_seguro_ins BEFORE INSERT ON productos
FOR EACH ROW
BEGIN
    IF NEW.seguro IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM productos p WHERE p.seguro = NEW.seguro AND p.duenio <> NEW.duenio) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Una poliza solo puede combinar piezas del mismo duenio';
        END IF;
        IF EXISTS (SELECT 1 FROM productos p WHERE p.seguro = NEW.seguro)
           AND COALESCE((SELECT s.polizaCombinada FROM seguros s WHERE s.nroPoliza = NEW.seguro), 'no') <> 'si' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'La poliza no admite multiples piezas';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_productos_seguro_upd BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NEW.seguro IS NOT NULL AND NOT (NEW.seguro <=> OLD.seguro) THEN
        IF EXISTS (SELECT 1 FROM productos p
                   WHERE p.seguro = NEW.seguro AND p.identificador <> NEW.identificador
                     AND p.duenio <> NEW.duenio) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Una poliza solo puede combinar piezas del mismo duenio';
        END IF;
        IF EXISTS (SELECT 1 FROM productos p
                   WHERE p.seguro = NEW.seguro AND p.identificador <> NEW.identificador)
           AND COALESCE((SELECT s.polizaCombinada FROM seguros s WHERE s.nroPoliza = NEW.seguro), 'no') <> 'si' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'La poliza no admite multiples piezas';
        END IF;
    END IF;
END$$

DELIMITER ;


-- ============================== SEED ========================================

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
INSERT INTO duenios (identificador, numeroPais, `verificaciÃ³nFinanciera`, `verificaciÃ³nJudicial`, calificacionRiesgo, verificador) VALUES
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
 (50, DATE_ADD(CURDATE(), INTERVAL 15 DAY), '18:00:00', NULL,      3, 'Av. Siempre Viva 123', 100, 'si', 'si', 'plata'),
 (51, DATE_ADD(CURDATE(), INTERVAL 20 DAY), '19:00:00', NULL,      3, 'Salon Central 50',      80, 'si', 'no', 'oro'),
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

-- notificaciones -------------------------------------------------------------
INSERT INTO notificaciones (cliente, tipo, mensaje, leido) VALUES
 (4, 'BIENVENIDA', 'Bienvenido a Bidster. Ya podes participar en subastas activas.', 'no'),
 (6, 'ENVIO_INSPECCION:100', 'Recibimos el reloj para inspeccion y catalogacion.', 'no'),
 (8, 'PRODUCTO_ACEPTADO:104', 'La camara Leica fue aceptada para subasta.', 'no'),
 (9, 'CUENTA_COBRO_REQUERIDA:107', 'Recorda mantener activa tu cuenta de cobro para liquidaciones.', 'no');

