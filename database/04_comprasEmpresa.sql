-- ============================================================================
--  04_comprasEmpresa.sql
--  Migracion para una base YA creada (no dropea nada). Crea la tabla nueva
--  comprasEmpresa, que registra las piezas sin pujas que compra la empresa al
--  precio base al cerrarse el item.
--
--  Para bases nuevas no hace falta: ya esta incluida en 01_schema.sql.
--
--    mysql -u root -p subastas < database/04_comprasEmpresa.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS comprasEmpresa (
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
