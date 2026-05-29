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

  async function login(email, password) {
    const data = await authApi.login(email, password);
    setAuthToken(data.accessToken);
    setTokens(data);
    setUser(data.usuario);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
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
    <AuthContext.Provider value={{ user, tokens, booting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
