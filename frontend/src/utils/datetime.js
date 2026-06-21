// Manejo de fechas/horas.
//
// El backend opera SIEMPRE en UTC. Los timestamps llegan como ISO-8601 sin zona
// (ej: "2026-06-21T15:30:00"). Hay que interpretarlos como UTC y mostrarlos en la
// zona horaria local del dispositivo del usuario.

/**
 * Convierte un valor del backend (string ISO sin zona, o con Z/offset) a un Date
 * absoluto. Si no trae zona, se asume UTC.
 */
export function parseServerDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const s = String(value);
  const tieneZona = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
  const d = new Date(tieneZona ? s : `${s}Z`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Combina una fecha (LocalDate "2026-06-21") y una hora (LocalTime "15:30[:ss]")
 * del backend, interpretadas como UTC, en un Date local.
 */
export function parseServerDateAndTime(fecha, hora) {
  if (!fecha) return null;
  const h = hora ? (hora.length === 5 ? `${hora}:00` : hora) : '00:00:00';
  return parseServerDate(`${fecha}T${h}`);
}

/** Fecha + hora en la zona del usuario, ej "21 jun 2026, 12:30". */
export function formatDateTime(value) {
  const d = parseServerDate(value);
  if (!d) return '';
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Solo fecha en la zona del usuario, ej "21 jun 2026". */
export function formatDate(value) {
  const d = parseServerDate(value);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Solo hora en la zona del usuario, ej "12:30". */
export function formatTime(value) {
  const d = parseServerDate(value);
  if (!d) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
