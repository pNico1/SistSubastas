USE subastas;
CREATE TABLE IF NOT EXISTS cuentasCobroDuenio (
 id INT NOT NULL AUTO_INCREMENT, duenio INT NOT NULL, titular VARCHAR(150) NOT NULL,
 banco VARCHAR(150) NOT NULL, identificadorBancario VARCHAR(100) NOT NULL, moneda VARCHAR(3) NOT NULL,
 pais VARCHAR(100) NOT NULL, exterior VARCHAR(2) NOT NULL DEFAULT 'no', estado VARCHAR(10) NOT NULL DEFAULT 'activa',
 fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT pk_cuentasCobroDuenio PRIMARY KEY (id),
 CONSTRAINT fk_cuentasCobroDuenio_duenio FOREIGN KEY (duenio) REFERENCES personas (identificador));
CREATE TABLE IF NOT EXISTS liquidacionesVenta (
 id INT NOT NULL AUTO_INCREMENT, producto INT NOT NULL, duenio INT NOT NULL, adquisicion INT NULL,
 compraEmpresa INT NULL, cuentaCobro INT NOT NULL, importeBruto DECIMAL(18,2) NOT NULL,
 comision DECIMAL(18,2) NOT NULL, importeNeto DECIMAL(18,2) NOT NULL, moneda VARCHAR(3) NOT NULL,
 estado VARCHAR(12) NOT NULL, fechaGenerada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, fechaTransferencia DATETIME NULL,
 CONSTRAINT pk_liquidacionesVenta PRIMARY KEY (id), CONSTRAINT uq_liquidacionesVenta_producto UNIQUE (producto),
 CONSTRAINT fk_liquidacionesVenta_producto FOREIGN KEY (producto) REFERENCES productos (identificador),
 CONSTRAINT fk_liquidacionesVenta_duenio FOREIGN KEY (duenio) REFERENCES duenios (identificador),
 CONSTRAINT fk_liquidacionesVenta_adquisicion FOREIGN KEY (adquisicion) REFERENCES registroDeSubasta (identificador),
 CONSTRAINT fk_liquidacionesVenta_cuenta FOREIGN KEY (cuentaCobro) REFERENCES cuentasCobroDuenio (id));
