import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../api/endpoints';

const palette = {
  background: '#F9F5FF',
  surface: '#FFFFFF',
  field: '#E2DFFF',
  primary: '#0B64ED',
  text: '#2B2A51',
  muted: '#8B88A8',
  border: '#E9E5FF',
  danger: '#FF748D',
  infoBg: '#FFF7E6',
  infoText: '#9A6B00',
};

// Paso 1 de recuperacion: pedir el codigo de reset al email.
export default function ForgotPasswordScreen({ route, navigation }) {
  const initialEmail = route?.params?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function enviar() {
    setError(null);
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Ingresa un email valido');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(value);
      // Respuesta generica (no revela si el email existe). En dev, viene el codigo.
      navigation.replace('ResetPassword', { email: value, devCode: res?.devCode || null });
    } catch (err) {
      setError(err.message || 'No se pudo enviar el codigo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.brand}>Bidster</Text>
            <View style={{ width: 28 }} />
          </View>

          <Text style={styles.icon}>🔑</Text>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresá tu email y te enviamos un código de 6 dígitos para crear una nueva contraseña.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="tu@email.com"
            placeholderTextColor="#C9C3E8"
            style={[styles.input, error && styles.inputError]}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity activeOpacity={0.9} onPress={enviar} disabled={loading} style={[styles.button, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar código</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ResetPassword', { email: email.trim() })} style={{ marginTop: 18 }}>
            <Text style={styles.altLink}>Ya tengo un código</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backArrow: { fontSize: 30, color: palette.primary, fontWeight: '800', width: 28 },
  brand: { color: palette.primary, fontSize: 18, fontWeight: '900', flex: 1, textAlign: 'center' },
  icon: { fontSize: 48, textAlign: 'center', marginTop: 20, marginBottom: 12 },
  title: { fontSize: 27, fontWeight: '900', color: palette.text, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, color: palette.muted, textAlign: 'center', marginBottom: 28 },
  input: {
    backgroundColor: palette.field, borderRadius: 12, height: 54, paddingHorizontal: 16,
    fontSize: 16, color: palette.text, borderWidth: 1, borderColor: 'transparent',
  },
  inputError: { borderColor: palette.danger },
  error: { color: palette.danger, textAlign: 'center', marginTop: 12 },
  button: { height: 54, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  altLink: { color: palette.muted, textAlign: 'center', fontWeight: '600' },
});
