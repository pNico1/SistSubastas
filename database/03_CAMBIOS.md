
##  Adaptación T-SQL (SQL Server) → MySQL

- `int identity` → `INT AUTO_INCREMENT`
- `varbinary(max)` → `LONGBLOB`
- FK sin columna destino (`references empleados`) → con columna explícita (`REFERENCES empleados(identificador)`)
- Se elimina el separador de lote `go`
- Charset `utf8mb4` para soportar acentos en los **datos** (no en los nombres de columna)
- La FK circular `empleados.sector ↔ sectores.responsableSector` se cierra con un
  `ALTER TABLE` al final del script.

##  Columnas agregadas a tablas existentes

| Tabla | Columnas nuevas | Por qué |
|-------|-----------------|---------|
| `personas` | `apellido`, `fotoDocFrente`, `fotoDocDorso` | los endpoints usan nombre+apellido; el registro etapa 1 sube foto de documento |
| `subastas` | `moneda` (`ARS`/`USD`) | el TP exige subastas en pesos o dólares, no bimonetarias |
| `productos` | `estado`, `nombreArtista`, `fechaObra`, `historia`, `terminosAceptados` | ciclo de revisión/aceptación y datos de obras de arte |
| `fotos` | `url`, `orden` | el endpoint de fotos devuelve url y orden |
| `pujos` | `fechaHora` | el TP exige respetar el **orden** de las pujas; `oferta-actual` devuelve timestamp |
| `registroDeSubasta` | `estado`, `fecha` | adquisición: pendiente → pagado → entregado |

##  Tablas nuevas

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

##  Cómo cargar la base

```bash
mysql -u root -p < 01_schema.sql ¡¡DROPEA EL SCHEMA "subastas" AUTOMATICAMENTE!!
mysql -u root -p subastas < 02_seed.sql
```

Usuarios de prueba (password para todos: `Password123!`):

| email | rol | categoría |
|-------|-----|-----------|
| `juan@email.com` | cliente | oro |
| `maria@email.com` | cliente | plata |
| `admin@subastas.com` | empleado/admin | — |

> Validación: el esquema y el seed se verificaron con `sqlglot` (dialecto MySQL):
> 27 tablas, todas las FK resuelven, el seed respeta integridad referencial y
> todos los CHECK (enums) son válidos.

## Área 2 — tablas satélite

- **`devoluciones`** — seguimiento, transportista, costo y destino de la devolución
  de un producto (relación 1:1 con `productos`).
- **`solicitudesAumentoSeguro`** — registra solicitudes de aumento de cobertura sin
  modificar la póliza original ni agregar campos a tablas existentes.
