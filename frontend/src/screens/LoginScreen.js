import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
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
  primary: '#0B64ED',
  primaryDark: '#003CD3',
  text: '#2B2A51',
  muted: '#8B88A8',
  border: '#E9E5FF',
  infoBg: '#F2EEFF',
  infoText: '#514EB0',
  danger: '#FF748D',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'El email es obligatorio';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      nextErrors.email = 'Email inválido';
    }

    if (!password) {
      nextErrors.password = 'La contraseña es obligatoria';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit() {
    setServerError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setServerError(err?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>BIDSTER</Text>
        </View>

        <Image
  source={require('../assets/logo_subastas.png')}
  style={styles.logoBox}
  resizeMode="contain"
/>

        <Text style={styles.title}>Bienvenido de nuevo</Text>

        <Text style={styles.subtitle}>
          
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="name@example.com"
            placeholderTextColor="#B8B3D8"
            style={[styles.input, errors.email && styles.inputError]}
          />

          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          <Text style={[styles.label, styles.passwordLabel]}>PASSWORD</Text>

          <View style={[styles.passwordInputWrap, errors.password && styles.inputError]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor="#B8B3D8"
              style={styles.passwordInput}
            />

            <TouchableOpacity
              onPress={() => setShowPassword((current) => !current)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {serverError ? (
            <Text style={styles.serverError}>{serverError}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSubmit}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              ¿No tienes una cuenta?{' '}
              <Text style={styles.registerStrong}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ⓘ</Text>

          <Text style={styles.infoText}>
            <Text style={styles.infoStrong}>Exclusivo para Miembros: </Text>
            Para pujar por piezas cinéticas de alta gama o ver tu colección privada,
            se requiere un perfil verificado.
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },

  keyboardAvoiding: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },

  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },

 brand: {
  color: palette.primary,
  fontSize: 18,
  fontWeight: '900',
  letterSpacing: 1
},

logoBox: {
  width: 170,
  height: 170,
  marginBottom: 16,
},

  logoIcon: {
    color: palette.primary,
    fontSize: 64,
    fontWeight: '900',
  },

  title: {
    color: palette.text,
    fontSize: 35,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 34,
  },

  form: {
    width: '100%',
  },

  label: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  passwordLabel: {
    marginTop: 18,
  },

  input: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    backgroundColor: palette.field,
    color: palette.text,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  passwordInputWrap: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    backgroundColor: palette.field,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    color: palette.text,
    fontSize: 15,
  },

  eyeIcon: {
    color: palette.muted,
    fontSize: 16,
  },

  inputError: {
    borderColor: palette.danger,
  },

  errorText: {
    color: palette.danger,
    fontSize: 12,
    marginTop: 6,
  },

  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },

  forgotText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  serverError: {
    color: palette.danger,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },

  button: {
    width: '100%',
    height: 58,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },

  buttonDisabled: {
    backgroundColor: palette.primaryDark,
    opacity: 0.8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  registerLink: {
    marginTop: 28,
    alignItems: 'center',
  },

  registerText: {
    color: palette.muted,
    fontSize: 14,
  },

  registerStrong: {
    color: palette.primary,
    fontWeight: '900',
  },

  infoCard: {
    width: '100%',
    backgroundColor: palette.infoBg,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  infoIcon: {
    color: '#E777D1',
    fontSize: 20,
    marginTop: 1,
  },

  infoText: {
    flex: 1,
    color: palette.infoText,
    fontSize: 12,
    lineHeight: 18,
  },

  infoStrong: {
    fontWeight: '900',
    color: palette.text,
  },
});
