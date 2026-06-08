# Backend - Sistema de Subastas (entrega 2)

Spring Boot 3.2 + Java 17 + MySQL + JWT. Mapea el esquema del TP (Hibernate
**no** modifica la base: `ddl-auto=none`).

## Requisitos
- JDK 17+
- Maven 3.9+
- MySQL 8.0+ con la base cargada (ver `../database/`)

## Pasos

1. Crear la base y cargar datos:
   ```bash
   mysql -u root -p < ../database/01_schema.sql ¡¡DROPEA EL SCHEMA "subastas" AUTOMATICAMENTE!!
   mysql -u root -p subastas < ../database/02_seed.sql
   ```

2. Configurar credenciales (variables de entorno o editar `application.yml`):
   ```bash
   export DB_USER=root
   export DB_PASS=tu_password
   export JWT_SECRET=una-clave-secreta-de-al-menos-32-bytes-1234
   ```

   Emails de verificacion:
   - Sin configurar nada, el backend queda en modo dev y muestra el codigo en consola.
   - Para enviar mails reales a tu casilla con Mailtrap:
     ```bash
     export MAIL_PROVIDER=mailtrap
     export MAILTRAP_API_KEY=tu_api_key
     export MAIL_FROM=mailtrap@demomailtrap.co
     export MAIL_TEST_TO=tu_email_registrado_en_mailtrap
     ```
     Con el dominio demo de Mailtrap, `MAIL_TEST_TO` debe ser el email con el que
     registraste la cuenta. Para otros destinatarios necesitas un dominio verificado.
   - Para enviar mails reales con Resend:
     ```bash
     export MAIL_PROVIDER=resend
     export RESEND_API_KEY=re_xxxxxxxxx
     export MAIL_FROM=onboarding@resend.dev
     ```
     Para enviar a otras direcciones que no sean la de tu cuenta de Resend, verifica
     un dominio y usa un remitente de ese dominio en `MAIL_FROM`.

3. Levantar:
   ```bash
   mvn spring-boot:run
   ```
   API en `http://localhost:8080`.

## Usuarios de prueba (password: `Password123!`)
- `juan@email.com` — cliente categoria **oro** (tiene medio de pago verificado)
- `maria@email.com` — cliente categoria **plata** (ya pujo \$1500 en el Reloj)
- `admin@subastas.com` — empleado/admin

## Circuito completo implementado (pujar en subasta)
1. `POST /api/auth/login` → access + refresh token
2. `GET /api/subastas?estado=abierta` → lista de subastas
3. `GET /api/subastas/{id}/items` → items del catalogo
4. `GET /api/subastas/{id}/items/{itemId}/oferta-actual` → oferta vigente + proxima puja min/max
5. `POST /api/clientes/me/unirse` `{ "subastaId": 50 }` → unirse
6. `POST /api/subastas/{id}/items/{itemId}/pujas` `{ "importe": 1600 }` → pujar

> **Tiempo real:** para la entrega 2 el front refresca `oferta-actual` por *polling*.
> WebSocket/STOMP queda como mejora para la entrega 3.

## Endpoints por grupo
- **AUTH**: register (2 etapas), login, refresh, logout
- **SUBASTAS**: listar (filtros + paginado), detalle, estado, catalogo, items, oferta-actual, historial de pujas
- **PUJAS**: crear (valida reglas 1%/20%), mis pujas (+ filtros), detalle
- **CLIENTE (me)**: perfil, categoria, verificacion, unirse, salir, mis subastas
- **MEDIOS DE PAGO**: listar, detalle, crear, eliminar
- **PAISES**: listar, buscar, detalle
- **Amplitud (lectura)**: notificaciones, mis productos (dueño), adquisiciones, multas

## Manejo de errores
Todas las respuestas de error usan el formato:
```json
{ "code": "PUJA_TOO_LOW", "message": "...", "timestamp": "..." }
```
con el HTTP status del TP (401, 403, 404, 409, 422, etc.).
