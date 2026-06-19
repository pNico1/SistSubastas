import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, ActivityIndicator, Alert,
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

// Paso 2 de recuperacion: ingresar el codigo y la nueva contrasenia.
export default function ResetPasswordScreen({ route, navigation }) {
  const { email, devCode } = route?.params || {};

  const [codigo, setCodigo] = useState(devCode || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validar() {
    if (!/^\d{6}$/.test(codigo)) return 'Ingresá el código de 6 dígitos';
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      return 'La contraseña debe tener al menos 8 caracteres, una letra y un número';
    }
    if (password !== confirm) return 'Las contraseñas no coinciden';
    return null;
  }

  async function confirmar() {
    setError(null);
    const v = validar();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(email, codigo, password, confirm);
      Alert.alert('Listo', 'Tu contraseña fue actualizada. Ya podés iniciar sesión.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      if (err.code === 'CODE_EXPIRED') setError('El código expiró. Pedí uno nuevo.');
      else if (err.code === 'CODE_INVALID') setError('Código incorrecto. Revisá el mail.');
      else if (err.code === 'WEAK_PASSWORD') setError('La contraseña es muy débil.');
      else if (err.code === 'PASSWORD_MISMATCH') setError('Las contraseñas no coinciden.');
      else setError(err.message || 'No se pudo actualizar la contraseña');
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

          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>
            Enviamos un código a{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          <Text style={styles.label}>Código</Text>
          <TextInput
            value={codigo}
            onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            placeholder="------"
            placeholderTextColor="#C9C3E8"
            maxLength={6}
            style={[styles.codeInput, error && styles.inputError]}
          />

          <Text style={styles.label}>Nueva contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#C9C3E8"
            style={styles.input}
          />

          <Text style={styles.label}>Repetir contraseña</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="Repetí la contraseña"
            placeholderTextColor="#C9C3E8"
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {devCode ? (
            <View style={styles.devBox}>
              <Text style={styles.devText}>Modo dev: el código es {devCode} (también sale en la consola del backend).</Text>
            </View>
          ) : null}

          <TouchableOpacity activeOpacity={0.9} onPress={confirmar} disabled={loading} style={[styles.button, loading && { opacity: 0.6 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Actualizar contraseña</Text>}
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
  icon: { fontSize: 48, textAlign: 'center', marginTop: 12, marginBottom: 10 },
  title: { fontSize: 27, fontWeight: '900', color: palette.text, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, color: palette.muted, textAlign: 'center', marginBottom: 24 },
  email: { color: palette.text, fontWeight: '700' },
  label: { color: palette.text, fontWeight: '700', fontSize: 13, marginBottom: 6, marginTop: 14 },
  codeInput: {
    backgroundColor: palette.field, borderRadius: 12, height: 60, textAlign: 'center',
    fontSize: 28, fontWeight: '800', letterSpacing: 10, color: palette.text,
    borderWidth: 1, borderColor: 'transparent',
  },
  input: {
    backgroundColor: palette.field, borderRadius: 12, height: 54, paddingHorizontal: 16,
    fontSize: 16, color: palette.text, borderWidth: 1, borderColor: 'transparent',
  },
  inputError: { borderColor: palette.danger },
  error: { color: palette.danger, textAlign: 'center', marginTop: 14 },
  devBox: { backgroundColor: palette.infoBg, borderRadius: 10, padding: 12, marginTop: 16 },
  devText: { color: palette.infoText, fontSize: 12, textAlign: 'center' },
  button: { height: 54, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
