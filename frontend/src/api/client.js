import axios from 'axios';
import { BASE_URL } from '../config';

// Instancia central de axios.
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Token de acceso en memoria (lo setea el AuthContext).
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

// Callback que se dispara cuando una llamada autenticada devuelve 401
// (token vencido/invalido). Lo registra el AuthContext para cerrar sesion e ir a Login.
let onUnauthorized = null;
export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Normaliza TODOS los errores a la forma { code, message, status, isNetwork }
// para que las pantallas muestren alertas claras (requisito de manejo de errores).
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const data = error.response.data || {};
      // 401 en una llamada autenticada (no en /api/auth/*) => sesion vencida.
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/api/auth/');
      if (error.response.status === 401 && authToken && !isAuthEndpoint && onUnauthorized) {
        onUnauthorized();
      }
      return Promise.reject({
        status: error.response.status,
        code: data.code || 'ERROR',
        message: data.message || 'Ocurrio un error',
        fields: data.fields || null,
        isNetwork: false,
      });
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 0,
        code: 'TIMEOUT',
        message: 'La conexion tardo demasiado. Intenta de nuevo.',
        isNetwork: true,
      });
    }
    // sin respuesta del servidor -> problema de red / servidor caido
    return Promise.reject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Sin conexion con el servidor. Revisa tu internet o el BASE_URL.',
      isNetwork: true,
    });
  }
);

export default client;
