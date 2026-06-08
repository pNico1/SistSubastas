import React, { useEffect, useMemo } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const palette = {
  background: '#F9F5FF',
  surface: '#FFFFFF',
  primary: '#2357FF',
  primarySoft: '#6F86FF',
  text: '#2B2A51',
  muted: '#8B88A8',
  border: '#ECE8FF',
  warningBg: '#FDEAF7',
  warningText: '#B04288',
};

export default function RegisterSuccessScreen({ route, navigation }) {
  const { user, login, logout, refreshUser } = useAuth();
  const params = route?.params || {};
  const provisionalPassword = useMemo(
    () => params.provisionalPassword || user?.provisionalPassword || '',
    [params.provisionalPassword, user?.provisionalPassword]
  );
  const email = params.email || user?.email;
  const isLoggedPending = user?.estado === 'pending_verification';

  useEffect(() => {
    if (!isLoggedPending) return undefined;
    const id = setInterval(() => {
      refreshUser().catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [isLoggedPending, refreshUser]);

  async function copyPassword() {
    if (!provisionalPassword) {
      Alert.alert('Contrasenia provisoria', 'Usa la contrasenia provisoria que recibiste al registrarte.');
      return;
    }
    if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
      await globalThis.navigator.clipboard.writeText(provisionalPassword);
      Alert.alert('Copiada', 'La contrasenia provisoria fue copiada.');
      return;
    }
    Alert.alert('Copiar', 'Manten presionada la contrasenia para copiarla.');
  }

  async function goHome() {
    if (user) {
      await logout();
      return;
    }
    // Deja la sesion iniciada con la clave provisoria (queda pending_verification).
    // Al setear el usuario, el navigator pasa solo al stack autenticado (home).
    if (email && provisionalPassword) {
      try {
        await login(email, provisionalPassword);
        return;
      } catch (e) {
        // Si el auto-login falla, caemos al home publico.
      }
    }
    navigation.navigate('Bidster');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.checkOuter}>
          <View style={styles.checkInner}>
            <Text style={styles.check}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>¡Registro Exitoso!</Text>
        <Text style={styles.subtitle}>
          Tu cuenta se encuentra actualmente en proceso de verificacion. Te avisaremos en cuanto este activa.
        </Text>

        <View style={styles.passwordCard}>
          <View style={styles.passwordTextWrap}>
            <Text style={styles.passwordLabel}>CONTRASENIA PROVISORIA</Text>
            <Text selectable style={styles.passwordValue}>
              {provisionalPassword || 'BIDSTER-****'}
            </Text>
            {email ? <Text style={styles.email}>Cuenta: {email}</Text> : null}
          </View>
          <TouchableOpacity onPress={copyPassword} style={styles.copyButton} hitSlop={10}>
            <Text style={styles.copyIcon}>▣</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warning}>
          <Text style={styles.warningIcon}>i</Text>
          <Text style={styles.warningText}>
            Por seguridad, te recomendamos cambiar esta contrasenia una vez que tu cuenta sea aprobada.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.9} onPress={goHome} style={styles.button}>
          <Text style={styles.buttonText}>{user ? 'Cerrar sesion' : 'Ir al Inicio'}  →</Text>
        </TouchableOpacity>
        <View style={styles.galleryRow}>
          <View style={styles.line} />
          <Text style={styles.gallery}>THE KINETIC GALLERY</Text>
          <View style={styles.line} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 26,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 18,
  },
  checkOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#786FE3',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  checkInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#fff', fontSize: 25, fontWeight: '900' },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    maxWidth: 320,
    color: palette.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 32,
  },
  passwordCard: {
    width: '100%',
    minHeight: 82,
    borderRadius: 8,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#716BD0',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  passwordTextWrap: { flex: 1, minWidth: 0 },
  passwordLabel: {
    color: '#BDB8D8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  passwordValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  email: { color: palette.muted, fontSize: 12, marginTop: 8 },
  copyButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: { color: palette.primarySoft, fontSize: 22, fontWeight: '900' },
  warning: {
    width: '100%',
    borderRadius: 9,
    backgroundColor: palette.warningBg,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.warningText,
    color: palette.warningText,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 15,
    textAlign: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  warningText: { flex: 1, color: palette.warningText, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  footer: { paddingBottom: 20 },
  button: {
    height: 58,
    borderRadius: 9,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  galleryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 10,
  },
  line: { width: 54, height: 1, backgroundColor: '#E5E0F6' },
  gallery: { color: '#C9C3DF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
});
