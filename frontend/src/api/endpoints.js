import client from './client';

// ---- AUTH ----
export const authApi = {
  login: (email, password) =>
    client.post('/api/auth/login', { email, password }).then((r) => r.data),
  register: (data) =>
    client.post('/api/auth/register', data).then((r) => r.data),
  completeRegistration: (token, password, passwordConfirmation) =>
    client.post('/api/auth/register-complete', { token, password, passwordConfirmation }).then((r) => r.data),
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
  getCatalogo: (id) =>
    client.get(`/api/subastas/${id}/catalogo`).then((r) => r.data),
  getItems: (id) =>
    client.get(`/api/subastas/${id}/items`).then((r) => r.data),
  getOfertaActual: (id, itemId) =>
    client.get(`/api/subastas/${id}/items/${itemId}/oferta-actual`).then((r) => r.data),
  getHistorialPujas: (id, itemId) =>
    client.get(`/api/subastas/${id}/items/${itemId}/pujas`).then((r) => r.data),
  pujar: (id, itemId, importe) =>
    client.post(`/api/subastas/${id}/items/${itemId}/pujas`, { importe }).then((r) => r.data),
};

// ---- PAISES ----
export const paisesApi = {
  listar: (nombre) =>
    client.get('/api/paises', { params: nombre ? { nombre } : {} }).then((r) => r.data),
};

// ---- CLIENTE (me) ----
export const clienteApi = {
  perfil: () => client.get('/api/clientes/me').then((r) => r.data),
  misSubastas: () => client.get('/api/clientes/me/subasta').then((r) => r.data),
  unirse: (subastaId) =>
    client.post('/api/clientes/me/unirse', { subastaId }).then((r) => r.data),
  salir: () => client.delete('/api/clientes/me/salir').then((r) => r.data),
  misPujas: (params = {}) =>
    client.get('/api/clientes/me/pujas', { params }).then((r) => r.data),
  metodosPago: () => client.get('/api/clientes/me/metodos-pago').then((r) => r.data),
  notificaciones: () => client.get('/api/clientes/me/notifications').then((r) => r.data),
};
