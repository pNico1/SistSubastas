import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

// Etapa 2 del registro: el usuario define su clave con el token de verificacion.
// En produccion el token llega por mail; aca lo recibimos de la etapa 1 para
// poder probar el flujo completo en desarrollo (editable por si lo pega a mano).
export default function RegisterCompleteScreen({ route }) {
  const { completeRegistration } = useAuth();
  const params = route?.params || {};

  const [token, setToken] = useState(params.token || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Misma regla que el backend: >= 8 caracteres, al menos una letra y un numero.
  function isStrong(pwd) {
    return pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd);
  }

  function validate() {
    const e = {};
    if (!token.trim()) e.token = 'Falta el token de verificacion';
    if (!password) e.password = 'La contrasenia es obligatoria';
    else if (!isStrong(password))
      e.password = 'Minimo 8 caracteres, con al menos una letra y un numero';
    if (confirm !== password) e.confirm = 'Las contrasenias no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      // Si sale bien, queda la sesion iniciada y el navigator cambia de stack solo.
      await completeRegistration(token.trim(), password, confirm);
    } catch (err) {
      if (err.code === 'PASSWORD_MISMATCH') {
        setErrors((e) => ({ ...e, confirm: err.message }));
      } else if (err.code === 'WEAK_PASSWORD') {
        setErrors((e) => ({ ...e, password: err.message }));
      } else if (err.code === 'TOKEN_INVALID' || err.code === 'TOKEN_EXPIRED') {
        setErrors((e) => ({ ...e, token: err.message }));
      } else {
        setServerError(err.message || 'No se pudo completar el registro');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Definir contrasenia</Text>
        <Text style={styles.subtitle}>Paso 2 de 2 · activa tu cuenta</Text>

        {params.message ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{params.message}</Text>
            {params.email ? (
              <Text style={styles.noticeSub}>Cuenta: {params.email}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.form}>
          <TextField
            label="Token de verificacion"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            placeholder="Pega aqui el token"
            error={errors.token}
          />
          <Text style={styles.hint}>
            En produccion este token llega por email. En desarrollo viene del paso anterior.
          </Text>

          <TextField
            label="Contrasenia"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
            error={errors.password}
          />
          <TextField
            label="Repetir contrasenia"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="********"
            error={errors.confirm}
          />

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

          <Button title="Crear cuenta e ingresar" onPress={onSubmit} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  notice: {
    backgroundColor: '#EEF1FB',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { color: colors.primary, fontWeight: '600' },
  noticeSub: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  form: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: -spacing.sm, marginBottom: spacing.md },
  serverError: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
