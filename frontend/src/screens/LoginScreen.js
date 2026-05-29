import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('juan@email.com'); // prellenado para demo
  const [password, setPassword] = useState('Password123!');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = 'El email es obligatorio';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Email invalido';
    if (!password) e.password = 'La contrasenia es obligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      // el cambio de pantalla lo maneja el navigator segun el estado de auth
    } catch (err) {
      setServerError(err.message || 'No se pudo iniciar sesion');
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
        <Text style={styles.logo}>🔨</Text>
        <Text style={styles.title}>Iniciar sesion</Text>
        <Text style={styles.subtitle}>Ingresa para participar en las subastas</Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@email.com"
            error={errors.email}
          />
          <TextField
            label="Contrasenia"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
            error={errors.password}
          />

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

          <Button title="Ingresar" onPress={onSubmit} loading={loading} />
        </View>

        <Text style={styles.hint}>
          Demo: juan@email.com / Password123!
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  form: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16 },
  serverError: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  hint: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg, fontSize: 12 },
});
