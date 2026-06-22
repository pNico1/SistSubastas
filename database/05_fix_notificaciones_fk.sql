-- Fix para bases ya creadas: las notificaciones pueden ser para clientes
-- compradores o para duenios vendedores. En este esquema ambos son personas,
-- pero no todo duenio existe necesariamente en clientes.

ALTER TABLE notificaciones
    DROP FOREIGN KEY fk_notificaciones_clientes;

ALTER TABLE notificaciones
    ADD CONSTRAINT fk_notificaciones_personas
        FOREIGN KEY (cliente) REFERENCES personas (identificador);
