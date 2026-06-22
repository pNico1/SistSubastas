-- Migración incremental del circuito de pólizas.
-- No modifica columnas de ninguna tabla original.
USE subastas;

CREATE TABLE IF NOT EXISTS pagosAumentoSeguro (
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

DROP TRIGGER IF EXISTS trg_productos_seguro_ins;
DROP TRIGGER IF EXISTS trg_productos_seguro_upd;

DELIMITER $$

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
