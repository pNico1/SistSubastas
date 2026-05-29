# Cambios sobre la base de datos original

Regla del TP respetada: **no se modifican los campos (columnas) existentes en su
semántica**. Solo se corrigen errores de sintaxis, se agregan columnas y se
agregan tablas nuevas.

## 1. Correcciones de sintaxis del `.sql` original

| # | Tabla | Problema en el original | Corrección |
|---|-------|-------------------------|------------|
| F1 | `seguros` | `nroPoliza varchar(30) not null.` terminaba en punto | `,` |
| F2 | `personas` | faltaba `,` antes de `constraint pk_personas` | agregada |
| F3 | `duenios` | faltaba `,` luego de `verificador int not null` | agregada |
| F4 | `asistentes` | faltaba `,` luego de `subasta int not null` | agregada |
| F5 | `catalogos` | coma sobrante antes del `)` final | eliminada |
| F6 | `personas.estado` | CHECK con typo `'incativo'` | `'inactivo'` |
| F7 | `subastas.estado` | CHECK con typo `'carrada'` | `'cerrada'` (+ se agrega `'programada'`) |
| F8 | `duenios` | columnas con acento (`verificación...`) y encoding roto | sin acento: `verificacionFinanciera`, `verificacionJudicial` |
| F9 | `subastas.chkFecha` | usaba `GETDATE()` (no determinista) | eliminado el CHECK; la regla "+10 días" se valida en el backend |

## 2. Adaptación T-SQL (SQL Server) → MySQL

- `int identity` → `INT AUTO_INCREMENT`
- `varbinary(max)` → `LONGBLOB`
- FK sin columna destino (`references empleados`) → con columna explícita (`REFERENCES empleados(identificador)`)
- Se elimina el separador de lote `go`
- Charset `utf8mb4` para soportar acentos en los **datos** (no en los nombres de columna)
- La FK circular `empleados.sector ↔ sectores.responsableSector` se cierra con un
  `ALTER TABLE` al final del script.

## 3. Columnas agregadas a tablas existentes

| Tabla | Columnas nuevas | Por qué |
|-------|-----------------|---------|
| `personas` | `apellido`, `fotoDocFrente`, `fotoDocDorso` | los endpoints usan nombre+apellido; el registro etapa 1 sube foto de documento |
| `subastas` | `moneda` (`ARS`/`USD`) | el TP exige subastas en pesos o dólares, no bimonetarias |
| `productos` | `estado`, `nombreArtista`, `fechaObra`, `historia`, `terminosAceptados` | ciclo de revisión/aceptación y datos de obras de arte |
| `fotos` | `url`, `orden` | el endpoint de fotos devuelve url y orden |
| `pujos` | `fechaHora` | el TP exige respetar el **orden** de las pujas; `oferta-actual` devuelve timestamp |
| `registroDeSubasta` | `estado`, `fecha` | adquisición: pendiente → pagado → entregado |

## 4. Tablas nuevas (las exigen los endpoints / el enunciado)

- **`usuarios`** — credenciales y estado de cuenta (1:1 con `personas`). `personas`
  no tiene email ni password, que son imprescindibles para AUTH (register 2 etapas,
  login, refresh, reset).
- **`tokens`** — verificación de registro, refresh y reset de password.
- **`mediosPago`** — tarjetas, cuentas bancarias y cheques certificados. Se necesita
  al menos uno **verificado** para poder pujar.
- **`notificaciones`** — mensajes al cliente (p. ej. `PUJA_SUPERADA`).
- **`revisiones`** — ciclo de inspección de un producto.
- **`entregas`** — envío o retiro de una adquisición.
- **`facturas`** — factura de compra.
- **`multas`** — multa del 10% por incumplimiento de pago.
- **`pagos`** — pago de adquisiciones y de multas.

## 5. Cómo cargar la base

```bash
mysql -u root -p < 01_schema.sql
mysql -u root -p subastas < 02_seed.sql
```

Usuarios de prueba (password para todos: `Password123!`):

| email | rol | categoría |
|-------|-----|-----------|
| `juan@email.com` | cliente | oro |
| `maria@email.com` | cliente | plata |
| `admin@subastas.com` | empleado/admin | — |

> Validación: el esquema y el seed se verificaron con `sqlglot` (dialecto MySQL):
> 25 tablas, todas las FK resuelven, el seed respeta integridad referencial y
> todos los CHECK (enums) son válidos.
