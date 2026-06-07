import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/endpoints';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'subastas.auth';
const PAYMENT_SETUP_KEY = 'subastas.paymentSetupPending';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [booting, setBooting] = useState(true);
  const [paymentSetupPending, setPaymentSetupPending] = useState(false);

  // Restaurar sesion guardada al abrir la app.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setAuthToken(saved.accessToken);
          const usuario = await authApi.me().catch(() => saved.usuario);
          const hydrated = { ...saved, usuario };
          setTokens(hydrated);
          setUser(usuario);
          const paymentPending = await AsyncStorage.getItem(PAYMENT_SETUP_KEY);
          setPaymentSetupPending(paymentPending === 'true' && usuario?.estado === 'active');
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
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
  async function applySession(data, userExtras = {}, options = {}) {
    setAuthToken(data.accessToken);
    setTokens(data);
    setUser({ ...data.usuario, ...userExtras });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (options.paymentSetupPending) {
      setPaymentSetupPending(true);
      await AsyncStorage.setItem(PAYMENT_SETUP_KEY, 'true');
    }
    return data;
  }

  async function login(email, password) {
    const data = await authApi.login(email, password);
    const extras = data.usuario?.estado === 'pending_verification'
      ? { provisionalPassword: password }
      : {};
    return applySession(data, extras);
  }

  // Etapa 1 del registro: crea la solicitud y devuelve la clave provisoria.
  // No inicia sesion: la cuenta queda pendiente de verificacion del admin.
  async function register(form) {
    return authApi.register(form);
  }

  // Etapa final: cambia la clave provisoria por una propia cuando el admin ya aprobo la cuenta.
  async function completeRegistration(password, passwordConfirmation) {
    const data = await authApi.completeRegistration(password, passwordConfirmation);
    return applySession(data, {}, { paymentSetupPending: true });
  }

  async function finishPaymentSetup() {
    setPaymentSetupPending(false);
    await AsyncStorage.removeItem(PAYMENT_SETUP_KEY);
  }

  async function refreshUser() {
    const usuario = await authApi.me();
    setUser((current) => ({ ...usuario, provisionalPassword: current?.provisionalPassword }));
    setTokens((current) => {
      if (!current) return current;
      const next = { ...current, usuario };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    return usuario;
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
    setPaymentSetupPending(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(PAYMENT_SETUP_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        booting,
        paymentSetupPending,
        login,
        logout,
        register,
        completeRegistration,
        finishPaymentSetup,
        refreshUser,
      }}
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
