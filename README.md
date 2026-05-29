# Sistema de Subastas — Entrega 2

Segunda entrega del TPO de Desarrollo de Aplicaciones: **50% del backend + 50%
del frontend**, con al menos un **circuito completo integrado y funcionando**.

Stack: **MySQL** + **Spring Boot 3 (Java 17)** + **Expo (React Native)**.

## Estructura

```
entrega2/
├── database/   01_schema.sql · 02_seed.sql · 03_CAMBIOS.md
├── backend/    API REST Spring Boot (Maven)
├── frontend/   App movil Expo
└── docs/       MANEJO_DE_ERRORES.md
```

## Circuito completo integrado: PUJAR EN SUBASTA

```
Login (JWT)
   └─> Lista de subastas abiertas
          └─> Detalle de subasta + catalogo  ──(unirse)──>
                 └─> Item: oferta actual en tiempo real (polling)
                        └─> Pujar (valida reglas 1% / 20%)  ──> backend ──> MySQL
```

Es el flujo más valioso del TP: ejercita auth, autorización por categoría,
medio de pago verificado, reglas de negocio de la puja y persistencia.

## Cómo correr todo (de cero)

1. **Base de datos** (MySQL 8):
   ```bash
   mysql -u root -p < database/01_schema.sql
   mysql -u root -p subastas < database/02_seed.sql
   ```
2. **Backend** (JDK 17 + Maven):
   ```bash
   cd backend
   export DB_USER=root DB_PASS=tu_pass JWT_SECRET=clave-secreta-de-32-bytes-min
   mvn spring-boot:run     # http://localhost:8080
   ```
3. **Frontend** (Node 18 + Expo Go):
   ```bash
   cd frontend
   npm install
   # editar src/config.js -> BASE_URL segun emulador/celular
   npx expo start
   ```
4. Login con `juan@email.com` / `Password123!` y seguir el circuito.

## Qué cubre cada parte

**Backend (≥50%)** — grupos de endpoints implementados:
AUTH (registro 2 etapas, login, refresh, logout), SUBASTAS (listar con filtros y
paginado, detalle, estado, catálogo, items, oferta-actual, historial de pujas),
PUJAS (crear con validación, mis pujas, detalle), CLIENTE/me (perfil, categoría,
verificación, unirse, salir), MEDIOS DE PAGO (CRUD), PAÍSES, y lecturas de
NOTIFICACIONES, PRODUCTOS (dueño), ADQUISICIONES y MULTAS.

**Frontend (≥50%)** — circuito de pujas completo: splash, login, lista de
subastas, detalle/catálogo, y pantalla de puja con oferta en tiempo real.
Manejo de errores, validación de formularios y estados de carga/sin conexión.

## Decisiones y desvíos (para defender)

- **Base**: se respetaron los campos existentes; se corrigieron errores de
  sintaxis y se agregaron tablas/columnas que los endpoints ya asumían
  (ver `database/03_CAMBIOS.md`).
- **Tiempo real por polling** (no WebSocket) en esta entrega; migrable en la 3ra.
- **`PUJA_TOO_HIGH` (409)** y **`NO_VERIFIED_PAYMENT_METHOD` (403)**: códigos
  agregados para hacer cumplir reglas del enunciado que no tenían código propio
  en la tabla original.
- **Registro**: la etapa 1 crea el cliente como `admitido='no'`; la etapa 2
  (con token) lo activa. En producción, la categoría/admisión la define un
  empleado durante la verificación.

## Verificación realizada (sin entorno de compilación en este equipo)

- **DB**: esquema y seed validados con `sqlglot` (dialecto MySQL) — 25 tablas,
  todas las FK resuelven, integridad referencial del seed OK, todos los CHECK
  válidos.
- **Backend**: 106 archivos Java — package vs ruta, nombre de tipo vs archivo,
  balance de llaves y llamadas a repositorios contrastadas con métodos
  declarados/heredados. Falta compilar con Maven en tu equipo (`mvn compile`).
- **Frontend**: 16 archivos JS — delimitadores balanceados, imports relativos
  válidos y paquetes declarados en `package.json`.
