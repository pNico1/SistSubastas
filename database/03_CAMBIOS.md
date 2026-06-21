# Cambios respecto de EstructuraActual.sql

Regla: las 16 tablas originales están en la base **tal cual el archivo**: mismas
columnas, mismos nombres (incluidos los acentos de `duenios`), mismos valores de
CHECK (incluidos los typos `'incativo'` y `'carrada'`). No se les agregó ninguna
columna ni FK. Todo dato que necesita la app vive en tablas aparte.

## Únicas correcciones (solo sintaxis)

| # | Corrección |
|---|------------|
| S1 | `seguros`: `nroPoliza varchar(30) not null.` → la `.` final era una `,` |
| S2 | `personas`: faltaba `,` antes de la PK |
| S3 | `duenios`: faltaba `,` después de `verificador` |
| S4 | `asistentes`: faltaba `,` después de `subasta` |
| S5 | `catalogos`: coma sobrante antes del `)` |
| T1 | T-SQL → MySQL: `identity` → `AUTO_INCREMENT`, `varbinary(max)` → `LONGBLOB`, sin `go`, FK con columna destino explícita (MySQL la exige) |
| T2 | CHECK de columna sin nombre (MariaDB no admite nombrarlos inline) |
| T3 | `chkFecha` usaba `getdate()`: MySQL no admite funciones no deterministas en CHECK. La misma regla (+10 días) se implementa con triggers `trg_subastas_fecha_ins/upd` |

## Tablas satélite (1:1 con la original, PK = FK)

Reemplazan a las columnas que antes se habían agregado a las tablas originales:

| Satélite | Columnas | Antes estaba en |
|----------|----------|-----------------|
| `personasDatos` | `apellido`, `fotoDocFrente`, `fotoDocDorso` | `personas` |
| `subastasDatos` | `moneda` (ARS/USD) | `subastas` |
| `productosDatos` | `estado`, `nombreArtista`, `fechaObra`, `historia`, `terminosAceptados` | `productos` |
| `fotosDatos` | `url`, `orden` | `fotos` |
| `pujosDatos` | `fechaHora` | `pujos` |
| `registroDeSubastaDatos` | `estado`, `fecha` | `registroDeSubasta` |

En el backend se mapean con `@SecondaryTable` de JPA, así que las entidades y
servicios siguen usando los mismos campos.

## Estados de subasta

El CHECK original solo admite `'abierta'` / `'carrada'` (typo literal). El valor
`'programada'` ya no existe: una subasta aún no abierta tiene `estado = NULL`.
Para cerrar una subasta el backend escribe `'carrada'`.

## Tablas nuevas

- **`usuarios`** — credenciales y estado de cuenta (1:1 con `personas`).
- **`tokens`** — verificación de registro, refresh y reset de password.
- **`mediosPago`** — tarjetas, cuentas bancarias y cheques certificados.
- **`notificaciones`** — mensajes al cliente (p. ej. `PUJA_SUPERADA`).
- **`revisiones`** — ciclo de inspección de un producto.
- **`entregas`** — envío o retiro de una adquisición.
- **`facturas`** — factura de compra.
- **`multas`** — multa del 10% por incumplimiento de pago.
- **`pagos`** — pago de adquisiciones y de multas.
- **`registrosPendientes`** — registros de postores que aún no verificaron su
  email. Evita el dead-end de abandonar el registro antes de poner el código
  (ver más abajo). No tiene FK a tablas originales: la persona todavía no existe.
- **`comprasEmpresa`** — piezas sin pujas que la empresa compra al precio base al
  cerrarse el ítem. No hay cliente, por eso no entra en `registroDeSubasta`.

Total: 16 originales + 6 satélites + 11 nuevas = **33 tablas**.


## Registro en dos fases (staging + binding por token)

Antes, `register()` creaba `personas` + `usuarios` + `clientes` y recién después
mandaba el código. Si el usuario cerraba la app sin verificar, quedaba trabado:
el email y el documento ya estaban tomados y la clave provisoria (que se muestra
recién en la pantalla de éxito) nunca se llegaba a ver.

Ahora `register()` **no escribe en ninguna tabla original**: inserta una fila en
`registrosPendientes` (datos + clave provisoria hasheada + código en claro, 15
min de expiración) y devuelve un `registrationId` (un `token` opaco) junto con la
clave provisoria. Las filas reales (`personas`/`personasDatos`, `usuarios`,
`clientes`) se crean **solo cuando el usuario verifica el código**
(`verify-email`), y ahí se borra el pendiente.

La verificación y el reenvío se atan al **`token`**, no al email: cada
registración es su propia fila. Así, si dos personas usan el mismo email (p. ej.
una tipea mal su dirección), cada una solo puede completar su propia registración
con el código que le corresponde, sin que se pisen ni se mezclen los datos. El
código de verificación ya no usa la tabla `tokens` (que requería un `usuario`
existente); vive en `registrosPendientes`.

## Recuperación de contraseña

Se agregó el flujo `forgot-password` / `reset-password` (endpoints
`/api/auth/forgot-password` y `/api/auth/reset-password`) usando la tabla
`tokens` con `tipo = 'reset'` (ya contemplada en el CHECK). Cubre el caso de
perder la clave provisoria. No requiere cambios de esquema.

## Cómo cargar la base

```bash
mysql -u root -p < 01_schema.sql   # ¡¡DROPEA EL SCHEMA "subastas" AUTOMATICAMENTE!!
mysql -u root -p subastas < 02_seed.sql
```

El seed usa fechas relativas a `CURDATE()` para cumplir el trigger de +10 días.

Usuarios de prueba (password para todos: `Password123!`):

| email | rol | categoría |
|-------|-----|-----------|
| `juan@email.com` | cliente | oro |
| `maria@email.com` | cliente | plata |
| `admin@subastas.com` | empleado/admin | — |

> Validación: el esquema y el seed se verificaron con `sqlglot` (dialecto MySQL):
> 25 tablas, todas las FK resuelven, el seed respeta integridad referencial y
> todos los CHECK (enums) son válidos.
