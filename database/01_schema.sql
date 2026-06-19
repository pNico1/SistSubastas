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
    `verificaciónFinanciera` varchar(2) check(`verificaciónFinanciera` in ('si','no')),  -- [T2]
    `verificaciónJudicial` varchar(2) check(`verificaciónJudicial` in ('si','no')),      -- [T2]
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
CREATE TABLE notificaciones (
    id       INT          NOT NULL AUTO_INCREMENT,
    cliente  INT          NOT NULL,
    tipo     VARCHAR(40)  NOT NULL,
    mensaje  VARCHAR(300) NOT NULL,
    leido    VARCHAR(2)   NOT NULL DEFAULT 'no' CHECK (leido IN ('si','no')),
    fecha    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notificaciones PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador)
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

-- registrosPendientes: registros de postores que AUN NO verificaron su email.
--  No se crean filas en personas/usuarios/clientes hasta que el usuario ingresa
--  el codigo. Asi, si abandona el registro antes de verificar, no queda nada en
--  las tablas reales y puede volver a registrarse con el mismo email/documento.
--  NO tiene FK a tablas originales (la persona todavia no existe). El codigo se
--  guarda en claro (es efimero, 15 min); la clave provisoria se guarda HASHEADA.
CREATE TABLE registrosPendientes (
    id            INT          NOT NULL AUTO_INCREMENT,
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
    CONSTRAINT uq_registrosPendientes_email UNIQUE (email)
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
    IF NEW.fecha IS NOT NULL AND 