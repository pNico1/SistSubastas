import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/endpoints';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'subastas.auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [booting, setBooting] = useState(true);

  // Restaurar sesion guardada al abrir la app.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setAuthToken(saved.accessToken);
          setTokens(saved);
          setUser(saved.usuario);
        }
      } catch (e) {
        // ignora: arranca sin sesion
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Aplica una respuesta de tokens (login o registro completado): guarda en
  // memoria + estado + AsyncStorage. Al setear el usuario, el navigator pasa
  // automaticamente del stack de auth al de la app.
  async function applySession(data) {
    setAuthToken(data.accessToken);
    setTokens(data);
    setUser(data.usuario);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  async function login(email, password) {
    const data = await authApi.login(email, password);
    return applySession(data);
  }

  // Etapa 1 del registro: crea la solicitud (queda pendiente de verificacion).
  // No inicia sesion; devuelve { registrationId, status, message, token }.
  async function register(form) {
    return authApi.register(form);
  }

  // Etapa 2 del registro: define la clave y, si todo va bien, deja la sesion
  // iniciada (el backend devuelve access + refresh).
  async function completeRegistration(token, password, passwordConfirmation) {
    const data = await authApi.completeRegistration(token, password, passwordConfirmation);
    return applySession(data);
  }

  async function logout() {
    try {
      if (tokens?.refreshToken) await authApi.logout(tokens.refreshToken);
    } catch (e) {
      // ignora errores de red en el logout
    }
    setAuthToken(null);
    setTokens(null);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{ user, tokens, booting, login, logout, register, completeRegistration }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
