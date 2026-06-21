import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const palette = {
  background: '#F9F5FF',
  surface: '#FFFFFF',
  field: '#E2DFFF',
  fieldText: '#2B2A51',
  primary: '#2357FF',
  primarySoft: '#6F86FF',
  text: '#2B2A51',
  muted: '#8B88A8',
  border: '#ECE8FF',
  danger: '#FF748D',
  infoBg: '#F4F1FF',
};

export default function RegisterCompleteScreen({ navigation }) {
  const { completeRegistration, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  function isStrong(pwd) {
    return pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd);
  }

  function validate() {
    const next = {};
    if (!password) next.password = 'Ingresa una contrasenia';
    else if (!isStrong(password)) next.password = 'Debe tener al menos 8 caracteres, una letra y un numero';
    if (!confirm) next.confirm = 'Confirma la contrasenia';
    else if (confirm !== password) next.confirm = 'Las contrasenias no coinciden';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function suggestPassword() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    let generated = 'Bidster-';
    for (let i = 0; i < 4; i += 1) generated += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 2; i += 1) generated += numbers[Math.floor(Math.random() * numbers.length)];
    setPassword(generated);
    setConfirm(generated);
    setErrors({});
    setServerError(null);
  }

  async function onSubmit() {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await completeRegistration(password, confirm);
    } catch (err) {
      if (err.code === 'PASSWORD_MISMATCH') {
        setErrors((current) => ({ ...current, confirm: err.message }));
      } else if (err.code === 'WEAK_PASSWORD') {
        setErrors((current) => ({ ...current, password: err.message }));
      } else if (err.code === 'ACCOUNT_PENDING_VERIFICATION') {
        setServerError('Tu cuenta todavia esta pendiente de verificacion.');
      } else {
        setServerError(err.message || 'No se pudo finalizar el registro');
      }
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (navigation?.canGoBack()) {
      navigation.goBack();
      return;
    }
    logout();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={goBack} style={styles.backButton} hitSlop={10}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Password</Text>
            <View style={{ width: 34 }} />
          </View>

          <Text style={styles.title}>Seguridad{'\n'}ante todo.</Text>
          <Text style={styles.subtitle}>
            Define una contrasenia robusta para proteger tus pujas en Bidster.
          </Text>

          <PasswordField
            label="NUEVA CONTRASENIA"
            value={password}
            onChangeText={setPassword}
            visible={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            error={errors.password}
          />

          <PasswordField
            label="CONFIRMAR CONTRASENIA"
            value={confirm}
            onChangeText={setConfirm}
            visible={showConfirm}
            onToggle={() => setShowConfirm((current) => !current)}
            error={errors.confirm}
          />

          <TouchableOpacity onPress={suggestPassword} style={styles.suggest}>
            <Text style={styles.suggestIcon}>↝</Text>
            <Text style={styles.suggestText}>Sugerir contrasenia segura</Text>
          </TouchableOpacity>

          <View style={styles.info}>
            <Text style={styles.infoIcon}>i</Text>
            <Text style={styles.infoText}>
              La contrasenia debe tener al menos 8 caracteres, incluir una letra y un numero.
            </Text>
          </View>

          <View style={styles.securityBox}>
            <Text style={styles.shield}>♡</Text>
          </View>

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSubmit}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Finalizar Registro </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordField({ label, value, onChangeText, visible, onToggle, error }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder="••••••••"
          placeholderTextColor="#A9A3D0"
          style={styles.input}
        />
        <TouchableOpacity onPress={onToggle} hitSlop={10} style={styles.eyeButton}>
          <Text style={styles.eye}>{visible ? '◉' : '◎'}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 38,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: palette.primary,
    fontSize: 28,
    lineHeight: 29,
    fontWeight: '900',
  },
  headerTitle: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  title: {
    color: palette.text,
    fontSize: 31,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 12,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
    maxWidth: 310,
  },
  fieldWrap: { marginBottom: 18 },
  label: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  inputWrap: {
    height: 58,
    borderRadius: 10,
    backgroundColor: palette.field,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    color: palette.fieldText,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 0,
  },
  eyeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: { color: palette.muted, fontSize: 18, fontWeight: '900' },
  inputError: { borderColor: palette.danger },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    marginTop: 7,
    fontWeight: '700',
  },
  suggest: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 26,
    gap: 7,
  },
  suggestIcon: { color: palette.primary, fontSize: 16, fontWeight: '900' },
  suggestText: { color: palette.primary, fontSize: 14, fontWeight: '900' },
  info: {
    minHeight: 58,
    borderRadius: 10,
    backgroundColor: palette.infoBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 28,
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.primarySoft,
    color: palette.primarySoft,
    lineHeight: 15,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    marginRight: 10,
  },
  infoText: { flex: 1, color: palette.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  securityBox: {
    height: 86,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  shield: { color: '#D9D5EF', fontSize: 42, fontWeight: '900' },
  serverError: {
    color: palette.danger,
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 12,
  },
  button: {
    height: 60,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOpacity: 0.33,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.72 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
