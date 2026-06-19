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

// Verificacion de email por codigo de 6 digitos (enviado por mail).
export default function VerifyEmailScreen({ route, navigation }) {
  const { registrationId, email, provisionalPassword, devCode } = route?.params || {};

  const [codigo, setCodigo] = useState(devCode || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentMsg, setResentMsg] = useState(null);

  async function verificar() {
    setError(null);
    if (!/^\d{6}$/.test(codigo)) {
      setError('Ingresa el codigo de 6 digitos');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyEmail(registrationId, codigo);
      navigation.replace('RegisterSuccess', { provisionalPassword, email });
    } catch (err) {
      if (err.code === 'CODE_EXPIRED') setError('El codigo expiro. Pedi uno nuevo.');
      else if (err.code === 'CODE_INVALID') setError('Codigo incorrecto. Revisa el mail.');
      else setError(err.message || 'No se pudo verificar el codigo');
    } finally {
      setLoading(false);
    }
  }

  async function reenviar() {
    setResentMsg(null);
    setError(null);
    setResending(true);
    try {
      await authApi.resendCode(registrationId);
      setResentMsg('Te enviamos un nuevo codigo.');
    } catch (err) {
      setError(err.message || 'No se pudo reenviar el codigo');
    } finally {
      setResending(false);
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

        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Verifica tu email</Text>
        <Text style={styles.subtitle}>
          Enviamos un codigo de 6 digitos a{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <TextInput
          value={codigo}
          onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholder="------"
          placeholderTextColor="#C9C3E8"
          maxLength={6}
          style={[styles.codeInput, error && styles.codeInputError]}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {resentMsg ? <Text style={styles.resent}>{resentMsg}</Text> : null}

        {devCode ? (
          <View style={styles.devBox}>
            <Text style={styles.devText}>Modo dev: el codigo es {devCode} (tambien sale en la consola del backend).</Text>
          </View>
        ) : null}

        <TouchableOpacity activeOpacity={0.9} onPress={verificar} disabled={loading} style={[styles.button, loading && { opacity: 0.6 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verificar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={reenviar} disabled={resending} style={{ marginTop: 18 }}>
          <Text style={styles.resend}>{resending ? 'Reenviando...' : '¿No te llego? Reenviar codigo'}</Text>
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
  email: { color: palette.text, fontWeight: '700' },
  codeInput: {
    backgroundColor: palette.field, borderRadius: 12, height: 64, textAlign: 'center',
    fontSize: 30, fontWeight: '800', letterSpacing: 10, color: palette.text,
    borderWidth: 1, borderColor: 'transparent',
  },
  codeInputError: { borderColor: palette.danger },
  error: { color: palette.danger, textAlign: 'center', marginTop: 12 },
  resent: { color: palette.primary, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  devBox: { backgroundColor: palette.infoBg, borderRadius: 10, padding: 12, marginTop: 16 },
  devText: { color: palette.infoText, fontSize: 12, textAlign: 'center' },
  button: { height: 54, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  resend: { color: palette.muted, textAlign: 'center', fontWeight: '600' },
});
