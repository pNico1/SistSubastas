import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
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

async function networkFailure(error) {
  if (error.code === 'ECONNABORTED') {
    return {
      status: 0,
      code: 'TIMEOUT',
      message: 'La conexion tardo demasiado. Revisa tu internet e intenta de nuevo.',
      isNetwork: true,
      retryable: true,
    };
  }

  let offline = false;
  try {
    const state = await NetInfo.fetch();
    offline = state.isConnected === false || state.isInternetReachable === false;
  } catch {
    offline = false;
  }

  if (offline) {
    return {
      status: 0,
      code: 'OFFLINE',
      message: 'No hay conexion a internet. Conectate a una red e intenta nuevamente.',
      isNetwork: true,
      retryable: true,
    };
  }

  return {
    status: 0,
    code: 'SERVER_UNREACHABLE',
    message: 'No pudimos conectar con el servidor. Puede estar caido o tardando en iniciar.',
    isNetwork: true,
    retryable: true,
  };
}

// Normaliza TODOS los errores a la forma { code, message, status, isNetwork }
// para que las pantallas muestren alertas claras (requisito de manejo de errores).
client.interceptors.response.use(
  (response) => response,
  async (error) => {
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
        message: data.message || (error.response.status >= 500
          ? 'El servidor tuvo un problema. Intenta de nuevo en unos segundos.'
          : 'Ocurrio un error'),
        fields: data.fields || null,
        isNetwork: false,
        retryable: error.response.status >= 500,
      });
    }
    return Promise.reject(await networkFailure(error));
  }
);

export default client;
