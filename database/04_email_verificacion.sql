-- ============================================================================
--  Migracion: verificacion de email por codigo.
--  Correr UNA vez sobre la base YA cargada (no hace falta recrear todo).
--    mysql -h <IP> -u subastas -p subastas < 04_email_verificacion.sql
-- ============================================================================
USE subastas;

-- Marca si el usuario confirmo el codigo que se le envio por mail.
ALTER TABLE usuarios
    ADD COLUMN emailVerificado VARCHAR(2) NOT NULL DEFAULT 'no';
