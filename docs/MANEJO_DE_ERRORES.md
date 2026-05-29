# Manejo de errores (entrega 2)

Documento requerido por la 2da entrega. Describe cómo la app maneja campos
obligatorios/opcionales, alertas, conexión a internet y errores de negocio,
tanto en el **backend** (Spring Boot) como en el **frontend** (Expo).

## 1. Formato único de error (backend)

Todos los errores del backend responden con el mismo cuerpo:

```json
{ "code": "PUJA_TOO_LOW", "message": "La puja debe ser de al menos 1510", "timestamp": "2026-05-28T12:00:00Z" }
```

Lo centraliza `GlobalExceptionHandler` (`@RestControllerAdvice`). Cada error de
negocio se lanza como `ApiException(status, code, message)` con el HTTP status
que indica el TP.

## 2. Campos obligatorios y opcionales

**Backend** — validación con `jakarta.validation` (`@NotBlank`, `@NotNull`,
`@Email`) sobre los DTO. Si falla, el handler devuelve **422 VALIDATION_ERROR**
con el detalle por campo:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Hay campos invalidos o faltantes",
  "fields": { "email": "must not be blank", "importe": "must not be null" }
}
```

**Frontend** — validación previa al envío (no se llama a la API si el formulario
es inválido):
- `LoginScreen`: email obligatorio + formato válido, password obligatoria.
- `ItemDetailScreen`: importe obligatorio, numérico, dentro del rango min/máx.
- El componente `TextField` muestra el mensaje de error debajo del campo y lo
  resalta en rojo.

Campos **opcionales** (ej: `domicilio` en registro, `marca`/`cbu` en medio de
pago) no se validan como requeridos.

## 3. Alertas al usuario

- Errores de acción puntual (pujar, unirse, login) → `Alert.alert(titulo, mensaje)`
  usando el `message` que devuelve el backend. Ej: una puja baja muestra
  *"No se pudo pujar — La puja debe ser de al menos 1510"*.
- Errores al cargar una pantalla → componente `ErrorView` con ícono, mensaje y
  botón **Reintentar**.
- Éxitos relevantes (puja registrada, unión a subasta) → `Alert` de confirmación.

## 4. Conexión a internet / servidor caído

El interceptor de `axios` (`src/api/client.js`) normaliza estos casos:

| Situación | code | Mensaje al usuario |
|-----------|------|--------------------|
| Sin respuesta del servidor | `NETWORK_ERROR` | "Sin conexión con el servidor. Revisa tu internet o el BASE_URL." |
| Timeout (10s) | `TIMEOUT` | "La conexión tardó demasiado. Intenta de nuevo." |

`ErrorView` detecta `isNetwork` y muestra un ícono 📡 y el botón **Reintentar**.
Así el usuario distingue un problema de red de un error de negocio.

## 5. Errores de negocio del circuito de pujas

| HTTP | code | Cuándo | Dónde se ve |
|------|------|--------|-------------|
| 401 | `INVALID_CREDENTIALS` | email/clave incorrectos | Login (texto bajo el form) |
| 401 | `UNAUTHORIZED` | token vencido/ausente | global |
| 403 | `NOT_CLIENT` | el usuario no es cliente | al pujar |
| 403 | `NOT_PART_OF_SUBASTA` | pujar sin haberse unido | aviso en pantalla del item |
| 403 | `NO_VERIFIED_PAYMENT_METHOD` | pujar sin medio de pago verificado | alerta |
| 403 | `NOT_ALLOWED` | categoría insuficiente para la subasta | alerta al unirse |
| 404 | `SUBASTA_NOT_FOUND` / `ITEM_NOT_FOUND` | id inexistente | ErrorView |
| 409 | `SUBASTA_CERRADA` | pujar en subasta no abierta | alerta |
| 409 | `ITEM_ALREADY_SOLD` | ítem ya vendido | alerta |
| 409 | `ALREADY_JOINED` | unirse dos veces | alerta |
| 409 | `PUJA_TOO_LOW` | menor a (oferta + 1% base) | alerta |
| 409 | `PUJA_TOO_HIGH` | mayor a (oferta + 20% base) | alerta |
| 400 | `INVALID_AMOUNT` | importe ≤ 0 | alerta |

## 6. Integridad de la puja (regla del TP)

El TP exige que *"la app no permita otra puja hasta recibir confirmación"*.
Implementado en `ItemDetailScreen`: el botón **Pujar** queda deshabilitado
(`submitting = true`) desde el envío hasta recibir la respuesta del backend;
recién entonces se refresca la oferta y se vuelve a habilitar.
