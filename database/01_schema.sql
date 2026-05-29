-- ============================================================================
--  SISTEMA DE SUBASTAS - Esquema MySQL 8.0+ (entrega 2)
-- ============================================================================
--  Adaptado desde EstructuraActual.sql (T-SQL / SQL Server).
--
--  REGLAS DEL TP:
--   - NO se modifican los campos (columnas) existentes en su semantica.
--   - SI se permite: corregir errores de sintaxis, agregar columnas y tablas.
--
--  CORRECCIONES aplicadas sobre el SQL original (ver 03_CAMBIOS.md para detalle):
--   [F1] seguros.nroPoliza terminaba en '.' en vez de ','  -> corregido.
--   [F2] personas: faltaba ',' antes de la PK.              -> corregido.
--   [F3] duenios: faltaba ',' luego de 'verificador'.       -> corregido.
--   [F4] asistentes: faltaba ',' luego de 'subasta'.        -> corregido.
--   [F5] catalogos: coma sobrante antes del ')'.            -> corregido.
--   [F6] personas.estado: 'incativo' (typo) -> 'inactivo'.
--   [F7] subastas.estado: 'carrada' (typo) -> 'cerrada'; se agrega 'programada'.
--   [F8] duenios: columnas con acento (verificaci<f3>n...) -> sin acento,
--        para coincidir con el JSON de los endpoints y evitar problemas de encoding.
--   [F9] chkFecha de subastas usaba GETDATE(): MySQL no admite funciones no
--        deterministas en CHECK -> se elimina el CHECK y la regla "+10 dias"
--        se valida en el backend (devuelve 422 INVALID_DATE).
--   [T1] T-SQL -> MySQL: identity->AUTO_INCREMENT, varbinary(max)->LONGBLOB,
--        FK sin columna -> FK con columna explicita, se elimina 'go'.
-- ============================================================================

DROP DATABASE IF EXISTS subastas;
CREATE DATABASE subastas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE subastas;

-- ===========================  TABLAS EXISTENTES  ============================

-- paises ---------------------------------------------------------------------
CREATE TABLE paises (
    numero        INT          NOT NULL,
    nombre        VARCHAR(250) NOT NULL,
    nombreCorto   VARCHAR(250) NULL,
    capital       VARCHAR(250) NOT NULL,
    nacionalidad  VARCHAR(250) NOT NULL,
    idiomas       VARCHAR(150) NOT NULL,
    CONSTRAINT pk_paises PRIMARY KEY (numero)
);

-- personas -------------------------------------------------------------------
CREATE TABLE personas (
    identificador INT          NOT NULL AUTO_INCREMENT,
    documento     VARCHAR(20)  NOT NULL,
    nombre        VARCHAR(150) NOT NULL,
    direccion     VARCHAR(250),
    estado        VARCHAR(15)  CONSTRAINT chkEstado CHECK (estado IN ('activo','inactivo')), -- [F6]
    foto          LONGBLOB,                                                                  -- [T1] varbinary(max)
    -- columnas AGREGADAS (permitido):
    apellido      VARCHAR(150) NULL,        -- los endpoints usan nombre + apellido
    fotoDocFrente LONGBLOB     NULL,        -- registro etapa 1
    fotoDocDorso  LONGBLOB     NULL,
    CONSTRAINT pk_personas PRIMARY KEY (identificador)                                       -- [F2] faltaba la coma previa
);

-- usuarios (NUEVA): credenciales/estado de cuenta para auth (1:1 con personas)
-- Necesaria porque personas no tiene email ni password y los endpoints de AUTH
-- (register 2 etapas, login, refresh, reset) lo requieren.
CREATE TABLE usuarios (
    id              INT          NOT NULL AUTO_INCREMENT,
    persona         INT          NOT NULL,
    email           VARCHAR(150) NOT NULL,
    passwordHash    VARCHAR(100) NULL,       -- null hasta completar etapa 2
    estadoRegistro  VARCHAR(30)  NOT NULL DEFAULT 'pending_verification'
        CONSTRAINT chkEstadoReg CHECK (estadoRegistro IN
            ('pending_verification','approved','registration_incomplete','active','suspended')),
    fechaCreacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_persona UNIQUE (persona),
    CONSTRAINT fk_usuarios_personas FOREIGN KEY (persona) REFERENCES personas (identificador)
);

-- tokens (NUEVA): verificacion de registro, refresh y reset de password.
CREATE TABLE tokens (
    id          INT          NOT NULL AUTO_INCREMENT,
    usuario     INT          NOT NULL,
    valor       VARCHAR(200) NOT NULL,
    tipo        VARCHAR(20)  NOT NULL
        CONSTRAINT chkTipoToken CHECK (tipo IN ('verification','refresh','reset')),
    expira      DATETIME     NOT NULL,
    usado       VARCHAR(2)   NOT NULL DEFAULT 'no'
        CONSTRAINT chkTokenUsado CHECK (usado IN ('si','no')),
    CONSTRAINT pk_tokens PRIMARY KEY (id),
    CONSTRAINT uq_tokens_valor UNIQUE (valor),
    CONSTRAINT fk_tokens_usuarios FOREIGN KEY (usuario) REFERENCES usuarios (id)
);

-- empleados ------------------------------------------------------------------
-- (la FK a sectores se agrega al final por dependencia circular con sectores)
CREATE TABLE empleados (
    identificador INT          NOT NULL,
    cargo         VARCHAR(100),
    sector        INT          NULL,
    CONSTRAINT pk_empleados PRIMARY KEY (identificador),
    CONSTRAINT fk_empleados_personas FOREIGN KEY (identificador) REFERENCES personas (identificador) -- AGREGADA
);

-- sectores -------------------------------------------------------------------
CREATE TABLE sectores (
    identificador      INT          NOT NULL AUTO_INCREMENT,
    nombreSector       VARCHAR(150) NOT NULL,
    codigoSector       VARCHAR(10)  NULL,
    responsableSector  INT          NULL,
    CONSTRAINT pk_sectores PRIMARY KEY (identificador),
    CONSTRAINT fk_sectores_empleados FOREIGN KEY (responsableSector) REFERENCES empleados (identificador)
);

-- seguros --------------------------------------------------------------------
CREATE TABLE seguros (
    nroPoliza        VARCHAR(30)   NOT NULL,                          -- [F1] tenia '.' final
    compania         VARCHAR(150)  NOT NULL,
    polizaCombinada  VARCHAR(2)    CONSTRAINT chkpolizaCombinada CHECK (polizaCombinada IN ('si','no')),
    importe          DECIMAL(18,2) NOT NULL CONSTRAINT chkImporte CHECK (importe > 0),
    CONSTRAINT pk_seguro PRIMARY KEY (nroPoliza)
);

-- clientes -------------------------------------------------------------------
CREATE TABLE clientes (
    identificador INT         NOT NULL,
    numeroPais    INT,
    admitido      VARCHAR(2)  CONSTRAINT chkAdmitido CHECK (admitido IN ('si','no')),
    categoria     VARCHAR(10) CONSTRAINT chkCategoria CHECK (categoria IN ('comun','especial','plata','oro','platino')),
    verificador   INT         NOT NULL,
    CONSTRAINT pk_clientes PRIMARY KEY (identificador),
    CONSTRAINT fk_clientes_personas  FOREIGN KEY (identificador) REFERENCES personas (identificador),
    CONSTRAINT fk_clientes_empleados FOREIGN KEY (verificador)   REFERENCES empleados (identificador),
    CONSTRAINT fk_clientes_paises    FOREIGN KEY (numeroPais)    REFERENCES paises (numero)
);

-- duenios --------------------------------------------------------------------
CREATE TABLE duenios (
    identificador          INT        NOT NULL,
    numeroPais             INT,
    verificacionFinanciera VARCHAR(2) CONSTRAINT chkVF CHECK (verificacionFinanciera IN ('si','no')), -- [F8] sin acento
    verificacionJudicial   VARCHAR(2) CONSTRAINT chkVJ CHECK (verificacionJudicial   IN ('si','no')), -- [F8]
    calificacionRiesgo     INT        CONSTRAINT chkCR CHECK (calificacionRiesgo IN (1,2,3,4,5,6)),
    verificador            INT        NOT NULL,                                                        -- [F3] faltaba la coma
    CONSTRAINT pk_duenios PRIMARY KEY (identificador),
    CONSTRAINT fk_duenios_personas  FOREIGN KEY (identificador) REFERENCES personas (identificador),
    CONSTRAINT fk_duenios_empleados FOREIGN KEY (verificador)   REFERENCES empleados (identificador)
);

-- subastadores ---------------------------------------------------------------
CREATE TABLE subastadores (
    identificador INT         NOT NULL,
    matricula     VARCHAR(15),
    region        VARCHAR(50),
    CONSTRAINT pk_subastadores PRIMARY KEY (identificador),
    CONSTRAINT fk_subastadores_personas FOREIGN KEY (identificador) REFERENCES personas (identificador)
);

-- subastas -------------------------------------------------------------------
CREATE TABLE subastas (
    identificador        INT         NOT NULL AUTO_INCREMENT,
    fecha                DATE,                                  -- [F9] CHECK +10 dias se valida en backend
    hora                 TIME        NOT NULL,
    estado               VARCHAR(10) CONSTRAINT chkES CHECK (estado IN ('abierta','cerrada','programada')), -- [F7]
    subastador           INT         NULL,
    ubicacion            VARCHAR(350) NULL,
    capacidadAsistentes  INT         NULL,
    tieneDeposito        VARCHAR(2)  CONSTRAINT chkTD CHECK (tieneDeposito  IN ('si','no')),
    seguridadPropia      VARCHAR(2)  CONSTRAINT chkSP CHECK (seguridadPropia IN ('si','no')),
    categoria            VARCHAR(10) CONSTRAINT chkCS CHECK (categoria IN ('comun','especial','plata','oro','platino')),
    -- columna AGREGADA: el TP exige subastas en pesos o dolares (no bimonetaria)
    moneda               VARCHAR(3)  NOT NULL DEFAULT 'ARS'
        CONSTRAINT chkMoneda CHECK (moneda IN ('ARS','USD')),
    CONSTRAINT pk_subastas PRIMARY KEY (identificador),
    CONSTRAINT fk_subastas_subastadores FOREIGN KEY (subastador) REFERENCES subastadores (identificador)
);

-- productos ------------------------------------------------------------------
CREATE TABLE productos (
    identificador        INT          NOT NULL AUTO_INCREMENT,
    fecha                DATE,
    disponible           VARCHAR(2)   CONSTRAINT chkD CHECK (disponible IN ('si','no')),
    descripcionCatalogo  VARCHAR(500) NULL DEFAULT 'No Posee',
    descripcionCompleta  VARCHAR(300) NOT NULL,
    revisor              INT          NOT NULL,
    duenio               INT          NOT NULL,
    seguro               VARCHAR(30)  NULL,
    -- columnas AGREGADAS:
    estado               VARCHAR(20)  NULL DEFAULT 'en_revision'   -- en_revision/aprobado/rechazado/aceptado/en_subasta/vendido
        CONSTRAINT chkEstadoProd CHECK (estado IN
            ('en_revision','aprobado','rechazado','aceptado','en_subasta','vendido','devuelto')),
    nombreArtista        VARCHAR(200) NULL,   -- obras de arte / diseniador
    fechaObra            VARCHAR(50)  NULL,
    historia             VARCHAR(1000) NULL,
    terminosAceptados    VARCHAR(2)   NULL DEFAULT 'no'
        CONSTRAINT chkTerm CHECK (terminosAceptados IN ('si','no')),
    CONSTRAINT pk_productos PRIMARY KEY (identificador),
    CONSTRAINT fk_productos_empleados FOREIGN KEY (revisor) REFERENCES empleados (identificador),
    CONSTRAINT fk_productos_duenios   FOREIGN KEY (duenio)  REFERENCES duenios (identificador),
    CONSTRAINT fk_productos_seguros   FOREIGN KEY (seguro)  REFERENCES seguros (nroPoliza)   -- AGREGADA
);

-- fotos ----------------------------------------------------------------------
CREATE TABLE fotos (
    identificador INT      NOT NULL AUTO_INCREMENT,
    producto      INT      NOT NULL,
    foto          LONGBLOB NOT NULL,
    -- columna AGREGADA: el endpoint devuelve url/orden de la foto
    url           VARCHAR(300) NULL,
    orden         INT          NULL,
    CONSTRAINT pk_fotos PRIMARY KEY (identificador),
    CONSTRAINT fk_fotos_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

-- catalogos ------------------------------------------------------------------
CREATE TABLE catalogos (
    identificador INT          NOT NULL AUTO_INCREMENT,
    descripcion   VARCHAR(250) NOT NULL,
    subasta       INT          NULL,
    responsable   INT          NOT NULL,
    CONSTRAINT pk_catalogos PRIMARY KEY (identificador),
    CONSTRAINT fk_catalogos_empleados FOREIGN KEY (responsable) REFERENCES empleados (identificador),
    CONSTRAINT fk_catalogos_subastas  FOREIGN KEY (subasta)     REFERENCES subastas (identificador)  -- [F5] sin coma sobrante
);

-- itemsCatalogo --------------------------------------------------------------
CREATE TABLE itemsCatalogo (
    identificador INT           NOT NULL AUTO_INCREMENT,
    catalogo      INT           NOT NULL,
    producto      INT           NOT NULL,
    precioBase    DECIMAL(18,2) NOT NULL CONSTRAINT chkPB CHECK (precioBase > 0.01),
    comision      DECIMAL(18,2) NOT NULL CONSTRAINT chkC  CHECK (comision   > 0.01),
    subastado     VARCHAR(2)    CONSTRAINT chkS CHECK (subastado IN ('si','no')),
    CONSTRAINT pk_itemsCatalogo PRIMARY KEY (identificador),
    CONSTRAINT fk_itemsCatalogo_catalogos FOREIGN KEY (catalogo) REFERENCES catalogos (identificador),
    CONSTRAINT fk_itemsCatalogo_productos FOREIGN KEY (producto) REFERENCES productos (identificador)
);

-- asistentes -----------------------------------------------------------------
CREATE TABLE asistentes (
    identificador INT NOT NULL AUTO_INCREMENT,
    numeroPostor  INT NOT NULL,
    cliente       INT NOT NULL,
    subasta       INT NOT NULL,                                     -- [F4] faltaba la coma
    CONSTRAINT pk_asistentes PRIMARY KEY (identificador),
    CONSTRAINT fk_asistentes_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador),
    CONSTRAINT fk_asistentes_subasta  FOREIGN KEY (subasta) REFERENCES subastas (identificador)
);

-- pujos ----------------------------------------------------------------------
CREATE TABLE pujos (
    identificador INT           NOT NULL AUTO_INCREMENT,
    asistente     INT           NOT NULL,
    item          INT           NOT NULL,
    importe       DECIMAL(18,2) NOT NULL CONSTRAINT chkI CHECK (importe > 0.01),
    ganador       VARCHAR(2)    CONSTRAINT chkG CHECK (ganador IN ('si','no')) DEFAULT 'no',
    -- columna AGREGADA: el TP exige respetar el orden de las pujas y la
    -- oferta-actual devuelve timestamp.
    fechaHora     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pujos PRIMARY KEY (identificador),
    CONSTRAINT fk_pujos_asistentes    FOREIGN KEY (asistente) REFERENCES asistentes (identificador),
    CONSTRAINT fk_pujos_itemsCatalogo FOREIGN KEY (item)      REFERENCES itemsCatalogo (identificador)
);

-- registroDeSubasta (= adquisiciones) ----------------------------------------
CREATE TABLE registroDeSubasta (
    identificador INT           NOT NULL AUTO_INCREMENT,
    subasta       INT           NOT NULL,
    duenio        INT           NOT NULL,
    producto      INT           NOT NULL,
    cliente       INT           NOT NULL,
    importe       DECIMAL(18,2) NOT NULL CONSTRAINT chkImportePagado  CHECK (importe  > 0.01),
    comision      DECIMAL(18,2) NOT NULL CONSTRAINT chkComisionPagada CHECK (comision > 0.01),
    -- columnas AGREGADAS: estado/fecha de la adquisicion (pendiente->pagado->entregado)
    estado        VARCHAR(15)   NULL DEFAULT 'pendiente'
        CONSTRAINT chkEstadoAdq CHECK (estado IN ('pendiente','pagado','entregado','en_mora')),
    fecha         DATETIME      NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_registroDeSubasta PRIMARY KEY (identificador),
    CONSTRAINT fk_rds_subastas  FOREIGN KEY (subasta)  REFERENCES subastas (identificador),
    CONSTRAINT fk_rds_duenios   FOREIGN KEY (duenio)   REFERENCES duenios (identificador),
    CONSTRAINT fk_rds_productos FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_rds_clientes  FOREIGN KEY (cliente)  REFERENCES clientes (identificador)
);

-- ============================  TABLAS NUEVAS  ===============================

-- mediosPago (NUEVA): cuentas bancarias, tarjetas o cheques certificados.
-- El TP exige al menos un medio de pago verificado para poder pujar.
CREATE TABLE mediosPago (
    id              INT          NOT NULL AUTO_INCREMENT,
    cliente         INT          NOT NULL,
    tipo            VARCHAR(20)  NOT NULL
        CONSTRAINT chkTipoMP CHECK (tipo IN ('tarjeta','cuenta_bancaria','cheque')),
    marca           VARCHAR(50)  NULL,        -- tarjeta
    banco           VARCHAR(100) NULL,        -- cuenta bancaria
    ultimos4        VARCHAR(4)   NULL,
    cbu             VARCHAR(30)  NULL,
    titular         VARCHAR(150) NULL,
    moneda          VARCHAR(3)   NULL
        CONSTRAINT chkMonedaMP CHECK (moneda IN ('ARS','USD')),
    esInternacional VARCHAR(2)   NULL DEFAULT 'no'
        CONSTRAINT chkIntlMP CHECK (esInternacional IN ('si','no')),
    montoGarantia   DECIMAL(18,2) NULL,       -- cheque certificado: tope de compras
    estado          VARCHAR(15)  NOT NULL DEFAULT 'pending'
        CONSTRAINT chkEstadoMP CHECK (estado IN ('pending','verified','rejected')),
    fechaCreacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_mediosPago PRIMARY KEY (id),
    CONSTRAINT fk_mediosPago_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador)
);

-- notificaciones (NUEVA)
CREATE TABLE notificaciones (
    id       INT          NOT NULL AUTO_INCREMENT,
    cliente  INT          NOT NULL,
    tipo     VARCHAR(40)  NOT NULL,        -- PUJA_SUPERADA, GANASTE, etc.
    mensaje  VARCHAR(300) NOT NULL,
    leido    VARCHAR(2)   NOT NULL DEFAULT 'no'
        CONSTRAINT chkLeido CHECK (leido IN ('si','no')),
    fecha    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notificaciones PRIMARY KEY (id),
    CONSTRAINT fk_notificaciones_clientes FOREIGN KEY (cliente) REFERENCES clientes (identificador)
);

-- revisiones (NUEVA): ciclo de inspeccion de un producto.
CREATE TABLE revisiones (
    id            INT          NOT NULL AUTO_INCREMENT,
    producto      INT          NOT NULL,
    revisor       INT          NULL,
    estado        VARCHAR(15)  NOT NULL DEFAULT 'pendiente'
        CONSTRAINT chkEstadoRev CHECK (estado IN ('pendiente','aprobado','rechazado')),
    observaciones VARCHAR(500) NULL,
    motivo        VARCHAR(500) NULL,
    fecha         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_revisiones PRIMARY KEY (id),
    CONSTRAINT fk_revisiones_productos FOREIGN KEY (producto) REFERENCES productos (identificador),
    CONSTRAINT fk_revisiones_empleados FOREIGN KEY (revisor)  REFERENCES empleados (identificador)
);

-- entregas (NUEVA): envio o retiro de una adquisicion.
CREATE TABLE entregas (
    id                INT          NOT NULL AUTO_INCREMENT,
    adquisicion       INT          NOT NULL,
    tipo              VARCHAR(10)  NOT NULL
        CONSTRAINT chkTipoEnt CHECK (tipo IN ('envio','retiro')),
    estado            VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    direccion         VARCHAR(300) NULL,
    codigoRetiro      VARCHAR(20)  NULL,
    transportista     VARCHAR(100) NULL,
    codigoSeguimiento VARCHAR(50)  NULL,
    fechaEstimada     DATE         NULL,
    CONSTRAINT pk_entregas PRIMARY KEY (id),
    CONSTRAINT fk_entregas_rds FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador)
);

-- facturas (NUEVA)
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

-- multas (NUEVA): 10% por incumplimiento de pago.
CREATE TABLE multas (
    id          INT           NOT NULL AUTO_INCREMENT,
    cliente     INT           NOT NULL,
    adquisicion INT           NULL,
    importe     DECIMAL(18,2) NOT NULL,
    estado      VARCHAR(15)   NOT NULL DEFAULT 'pending'
        CONSTRAINT chkEstadoMulta CHECK (estado IN ('pending','paid')),
    fechaLimite DATE          NULL,
    fecha       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_multas PRIMARY KEY (id),
    CONSTRAINT fk_multas_clientes FOREIGN KEY (cliente)     REFERENCES clientes (identificador),
    CONSTRAINT fk_multas_rds      FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador)
);

-- pagos (NUEVA): pago de adquisiciones y de multas.
CREATE TABLE pagos (
    id           INT           NOT NULL AUTO_INCREMENT,
    adquisicion  INT           NULL,
    multa        INT           NULL,
    medioPago    INT           NOT NULL,
    importeTotal DECIMAL(18,2) NOT NULL,
    moneda       VARCHAR(3)    NOT NULL
        CONSTRAINT chkMonedaPago CHECK (moneda IN ('ARS','USD')),
    estado       VARCHAR(15)   NOT NULL DEFAULT 'pagado',
    fechaPago    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pagos PRIMARY KEY (id),
    CONSTRAINT fk_pagos_rds        FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador),
    CONSTRAINT fk_pagos_multas     FOREIGN KEY (multa)       REFERENCES multas (id),
    CONSTRAINT fk_pagos_mediosPago FOREIGN KEY (medioPago)   REFERENCES mediosPago (id)
);

-- ================  FK CIRCULAR empleados.sector -> sectores  ================
ALTER TABLE empleados
    ADD CONSTRAINT fk_empleados_sectores FOREIGN KEY (sector) REFERENCES sectores (identificador);
