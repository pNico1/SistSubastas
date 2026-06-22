import client from './client';

// ---- AUTH ----
export const authApi = {
  login: (email, password) =>
    client.post('/api/auth/login', { email, password }).then((r) => r.data),
  register: (data) =>
    client.post('/api/auth/register', data).then((r) => r.data),
  verifyEmail: (registrationId, codigo) =>
    client.post('/api/auth/verify-email', { registrationId, codigo }).then((r) => r.data),
  resendCode: (registrationId) =>
    client.post('/api/auth/resend-code', { registrationId }).then((r) => r.data),
  forgotPassword: (email) =>
    client.post('/api/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (email, codigo, password, passwordConfirmation) =>
    client.post('/api/auth/reset-password', { email, codigo, password, passwordConfirmation }).then((r) => r.data),
  completeRegistration: (password, passwordConfirmation) =>
    client.post('/api/auth/register-complete', { password, passwordConfirmation }).then((r) => r.data),
  me: () =>
    client.get('/api/auth/me').then((r) => r.data),
  refresh: (refreshToken) =>
    client.post('/api/auth/refresh', { refreshToken }).then((r) => r.data),
  logout: (refreshToken) =>
    client.post('/api/auth/logout', { refreshToken }).then((r) => r.data),
};

// ---- SUBASTAS ----
export const subastasApi = {
  listar: (params = {}) =>
    client.get('/api/subastas', { params }).then((r) => r.data),
  getById: (id) =>
    client.get(`/api/subastas/${id}`).then((r) => r.data),
  getEstado: (id) =>
    client.get(`/api/subastas/${id}/estado`).then((r) => r.data),
  itemActivo: (id) =>
    client.get(`/api/subastas/${id}/item-activo`).then((r) => r.data),
  getCatalogo: (id) =>
    client.get(`/api/subastas/${id}/catalogo`).then((r) => r.data),
  getItems: (id) =>
    client.get(`/api/subastas/${id}/items`).then((r) => r.data),
  getOfertaActual: (id, itemId) =>
    client.get(`/api/subastas/${id}/items/${itemId}/oferta-actual`).then((r) => r.data),
  getPujaActual: (id, itemId) =>
    client.get(`/api/subastas/${id}/items/${itemId}/puja-actual`).then((r) => r.data),
  getHistorialPujas: (id, itemId) =>
    client.get(`/api/subastas/${id}/items/${itemId}/pujas`).then((r) => r.data),
  pujar: (id, itemId, importe) =>
    client.post(`/api/subastas/${id}/items/${itemId}/pujas`, { importe }).then((r) => r.data),
  // ---- Área 3: fotos del item ----
  getItemPhotos: (id, itemId) =>
    client.get(`/api/subastas/${id}/items/${itemId}/photos`).then((r) => r.data),
  // ---- fin Área 3 ----
};

// ---- PAISES ----
export const paisesApi = {
  listar: (nombre) =>
    client.get('/api/paises', { params: nombre ? { nombre } : {} }).then((r) => r.data),
};

// ---- PRODUCTOS (dueño / "ofrecer un bien") ----
export const productosApi = {
  misProductos: () => client.get('/api/clientes/me/productos').then((r) => r.data),
  getById: (id) => client.get(`/api/clientes/me/productos/${id}`).then((r) => r.data),
  // data: { descripcionCatalogo, descripcionCompleta, nombreArtista, fechaObra,
  //         historia, precioBase, moneda, origenLicitoDeclarado, detalleOrigen,
  //         documentacionOrigen, terminosAceptados, fotos: [base64...] }
  crear: (data) => client.post('/api/clientes/me/productos', data).then((r) => r.data),

  // ---- Área 2: dueño / revisión / seguros ----
  getRejectMotive: (id) =>
    client.get(`/api/clientes/me/productos/${id}/rejectMotive`).then((r) => r.data),
  updateTerminos: (id, aceptados) =>
    client.patch(`/api/clientes/me/productos/${id}/terminos`, { aceptados }).then((r) => r.data),
  getDevolucion: (id) =>
    client.get(`/api/clientes/me/productos/${id}/devolucion`).then((r) => r.data),
  getEnvioInspeccion: (id) =>
    client.get(`/api/clientes/me/productos/${id}/envio-inspeccion`).then((r) => r.data),
  getSeguros: (id) =>
    client.get(`/api/clientes/me/productos/${id}/seguros`).then((r) => r.data),
  requestUpgradeSeguro: (id, data) =>
    client.patch(`/api/clientes/me/productos/${id}/seguros`, data).then((r) => r.data),
  getVenta: (id) =>
    client.get(`/api/clientes/me/productos/${id}/venta`).then((r) => r.data),
};

// ---- CLIENTE (me) ----
export const clienteApi = {
  perfil: () => client.get('/api/clientes/me').then((r) => r.data),
  // ---- Área 3: perfil y métricas ----
  actualizarPerfil: (data) => client.put('/api/clientes/me', data).then((r) => r.data),
  asistencias: () => client.get('/api/clientes/me/asistencias').then((r) => r.data),
  asistenciasStats: () => client.get('/api/clientes/me/asistencias/estadisticas').then((r) => r.data),
  historialSubastas: () => client.get('/api/clientes/me/subastas', { params: { historial: true } }).then((r) => r.data),
  victorias: () => client.get('/api/clientes/me/victorias').then((r) => r.data),
  victoriasStats: () => client.get('/api/clientes/me/victorias/estadisticas').then((r) => r.data),
  pujasStats: () => client.get('/api/clientes/me/pujas/estadisticas').then((r) => r.data),
  // ---- fin Área 3 ----
  misSubastas: () => client.get('/api/clientes/me/subastas').then((r) => r.data),
  unirse: (subastaId) =>
    client.post('/api/clientes/me/unirse', { subastaId }).then((r) => r.data),
  salir: () => client.delete('/api/clientes/me/salir').then((r) => r.data),
  misPujas: (params = {}) =>
    client.get('/api/clientes/me/pujas', { params }).then((r) => r.data),
  metodosPago: () => client.get('/api/clientes/me/metodos-pago').then((r) => r.data),
  crearMetodoPago: (data) =>
    client.post('/api/clientes/me/metodos-pago', data).then((r) => r.data),
  eliminarMetodoPago: (id) =>
    client.delete(`/api/clientes/me/metodos-pago/${id}`).then((r) => r.data),
  // NOTIFICACIONES: listar y marcar como leída (PATCH /read)
  notificaciones: () => client.get('/api/clientes/me/notifications').then((r) => r.data),
  marcarNotificacionLeida: (id) =>
    client.patch(`/api/clientes/me/notifications/${id}/read`).then((r) => r.data),
  cuentasCobro: () => client.get('/api/clientes/me/cuentas-cobro').then((r) => r.data),
  guardarCuentaCobro: (data) => client.post('/api/clientes/me/cuentas-cobro', data).then((r) => r.data),
  liquidaciones: () => client.get('/api/clientes/me/liquidaciones').then((r) => r.data),
};

// ---- ADQUISICIONES (compras de piezas ganadas — Área 1) ----
export const adquisicionesApi = {
  listar: (estado) =>
    client.get('/api/clientes/me/adquisiciones', { params: estado ? { estado } : {} }).then((r) => r.data),
  resumen: () =>
    client.get('/api/clientes/me/adquisiciones/resumen').then((r) => r.data),
  getById: (id) =>
    client.get(`/api/clientes/me/adquisiciones/${id}`).then((r) => r.data),
  factura: (id) =>
    client.get(`/api/clientes/me/adquisiciones/${id}/factura`).then((r) => r.data),
  // data: { paymentMethodId, moneda, confirmacionTerminos }
  pagar: (id, data) =>
    client.post(`/api/clientes/me/adquisiciones/${id}/payment`, data).then((r) => r.data),
  seleccionarEnvio: (id, direccion) =>
    client.post(`/api/clientes/me/adquisiciones/${id}/entrega/envio`, { direccion }).then((r) => r.data),
  seleccionarRetiro: (id) =>
    client.post(`/api/clientes/me/adquisiciones/${id}/entrega/retiro`, { confirmar: true }).then((r) => r.data),
  entrega: (id) => client.get(`/api/clientes/me/adquisiciones/${id}/entrega`).then((r) => r.data),
  declararSinFondos: (id) =>
    client.post(`/api/clientes/me/adquisiciones/${id}/sin-fondos`).then((r) => r.data),
};

// ---- MULTAS (Área 1) ----
export const multasApi = {
  listar: () => client.get('/api/clientes/me/fines').then((r) => r.data),
  getById: (id) => client.get(`/api/clientes/me/fines/${id}`).then((r) => r.data),
  pagar: (id, paymentMethodId) =>
    client.post(`/api/clientes/me/fines/${id}/payment`, { paymentMethodId }).then((r) => r.data),
};

// ---- ADMIN (segun contrato del PDF) ----
export const adminApi = {
  // ---- Área 2: catálogos paginados ----
  listarCatalogos: (params = {}) => client.get('/api/admin/catalogos', { params }).then((r) => r.data),
  solicitudesSeguro: (params = {}) => client.get('/api/admin/solicitudes-seguro', { params }).then((r) => r.data),
  aprobarSolicitudSeguro: (id) => client.put(`/api/admin/solicitudes-seguro/${id}/aprobar`).then((r) => r.data),
  rechazarSolicitudSeguro: (id) => client.put(`/api/admin/solicitudes-seguro/${id}/rechazar`).then((r) => r.data),
  // ---- fin Área 2 ----
  verificarCliente: (id, data = {}) => client.put(`/api/admin/clientes/${id}/verificar`, data).then((r) => r.data),
  verificarMetodoPago: (id) => client.put(`/api/admin/metodos-pago/${id}/verificar`).then((r) => r.data),

  crearSubasta: (data) => client.post('/api/admin/subastas', data).then((r) => r.data),
  asistentesSubasta: (id) => client.get(`/api/admin/subastas/${id}/asistentes`).then((r) => r.data),
  cerrarSubasta: (id) => client.post(`/api/admin/subastas/${id}/cerrar`).then((r) => r.data),

  crearCatalogo: (data) => client.post('/api/admin/catalogos', data).then((r) => r.data),
  getCatalogo: (id) => client.get(`/api/admin/catalogos/${id}`).then((r) => r.data),
  itemsCatalogo: (id) => client.get(`/api/admin/catalogos/${id}/items`).then((r) => r.data),
  agregarProductoCatalogo: (id, productId, data = {}) =>
    client.post(`/api/admin/catalogos/${id}/producto/${productId}`, data).then((r) => r.data),
  quitarProductoCatalogo: (catalogoId, productId) =>
    client.delete(`/api/admin/catalogos/${catalogoId}/producto/${productId}`).then((r) => r.data),
  actualizarCatalogo: (id, data) => client.put(`/api/admin/catalogos/${id}`, data).then((r) => r.data),
  eliminarCatalogo: (id) => client.delete(`/api/admin/catalogos/${id}`).then((r) => r.data),

  crearProducto: (data) => client.post('/api/admin/productos', data).then((r) => r.data),
  productos: (params = {}) => client.get('/api/admin/productos', { params }).then((r) => r.data),
  actualizarProducto: (id, data) => client.put(`/api/admin/productos/${id}`, data).then((r) => r.data),
  eliminarProducto: (id) => client.delete(`/api/admin/productos/${id}`).then((r) => r.data),
  agregarFotoProducto: (id, data) => client.post(`/api/admin/productos/${id}/fotos`, data).then((r) => r.data),
  asignarSeguroProducto: (id, nroPoliza) =>
    client.put(`/api/admin/productos/${id}/seguro`, { nroPoliza }).then((r) => r.data),

  actualizarDuenio: (id, data) => client.put(`/api/admin/duenios/${id}`, data).then((r) => r.data),

  seguros: () => client.get('/api/admin/seguros').then((r) => r.data),
  getSeguro: (nroPoliza) => client.get(`/api/admin/seguros/${nroPoliza}`).then((r) => r.data),
  crearSeguro: (data) => client.post('/api/admin/seguros', data).then((r) => r.data),
  actualizarSeguro: (nroPoliza, data) => client.put(`/api/admin/seguros/${nroPoliza}`, data).then((r) => r.data),

  generarFacturas: (subastaId) => client.post(`/api/admin/facturas/generar/${subastaId}`).then((r) => r.data),

  crearRevision: (data) => client.post('/api/admin/revisiones', data).then((r) => r.data),
  revisiones: (params = {}) => client.get('/api/admin/revisiones', { params }).then((r) => r.data),
  aprobarRevision: (id, data = {}) => client.put(`/api/admin/revisiones/${id}/aprobar`, data).then((r) => r.data),
  rechazarRevision: (id, data = {}) => client.put(`/api/admin/revisiones/${id}/rechazar`, data).then((r) => r.data),
};

// ---- Área 2: consulta pública de productos ----
export const productosPublicosApi = {
  getById: (id) => client.get(`/api/productos/${id}`).then((r) => r.data),
  fotos: (id) => client.get(`/api/productos/${id}/fotos`).then((r) => r.data),
  filtrar: (params = {}) => client.get('/api/productos', { params }).then((r) => r.data),
};
// ---- fin Área 2 ----
