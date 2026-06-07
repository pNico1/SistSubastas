import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const palette = {
  background: '#F9F5FF',
  surface: '#FFFFFF',
  field: '#DCD9FF',
  fieldFocus: '#EDE9FF',
  primary: '#0846ED',
  primaryDark: '#003CD3',
  primaryShadow: 'rgba(8, 70, 237, 0.22)',
  text: '#2B2A51',
  muted: '#585781',
  mutedLight: '#8B88A8',
  placeholder: '#B8B3D8',
  border: '#ABA9D7',
  borderFocus: '#0846ED',
  infoBg: '#F2EEFF',
  infoText: '#514EB0',
  danger: '#FF748D',
  dangerBg: '#FFF0F3',
  dangerBorder: '#FFC5D0',
  dangerText: '#C01048',
  decoCircle1: 'rgba(8, 70, 237, 0.06)',
  decoCircle2: 'rgba(145, 57, 131, 0.05)',
  white: '#FFFFFF',
};

const GRADIENT = [palette.primary, '#859AFF'];

// ─── Botón principal con gradiente kinético (igual a RegisterScreen) ────────
function PrimaryButton({ title, onPress, loading, icon }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], marginTop: 12 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={loading ? ['#ABA9D7', '#ABA9D7'] : GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.buttonText}>{title}</Text>
              {icon ? <Text style={styles.buttonArrow}>{icon}</Text> : null}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Ícono de martillo SVG inline como componente ───────────────────────────
function AuctionLogoBox() {
  return (
    <View style={styles.logoBox}>
      <View style={styles.logoGradient}>
        {/* Representación con View shapes ya que RN no tiene SVG nativo */}
        <Text style={styles.logoEmoji}>🔨</Text>
      </View>
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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
      setServerError(err?.message || 'No se pudo iniciar sesión. Revisá tus datos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Círculos decorativos de fondo */}
      <View style={styles.decoCircle1} pointerEvents="none" />
      <View style={styles.decoCircle2} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header con marca */}
        <View style={styles.header}>
          <Text style={styles.brand}>BIDSTER</Text>
        </View>

        {/* Logo */}
        <Image
          source={require('../assets/logo_subastas.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Hero text */}
        <Text style={styles.title}>Bienvenido{'\n'}de nuevo.</Text>
        <Text style={styles.subtitle}>
          Ingresá para continuar con tus subastas.
        </Text>

        {/* Formulario */}
        <View style={styles.form}>

          {/* Email */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View
            style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocus,
              errors.email && styles.inputWrapperError,
            ]}
          >
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="nombre@ejemplo.com"
              placeholderTextColor={palette.placeholder}
              style={[styles.input, emailFocused && styles.inputFocused]}
            />
          </View>
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          {/* Password */}
          <Text style={[styles.label, styles.labelSpacing]}>PASSWORD</Text>
          <View
            style={[
              styles.inputWrapper,
              styles.passwordWrapper,
              passwordFocused && styles.inputWrapperFocus,
              errors.password && styles.inputWrapperError,
            ]}
          >
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={palette.placeholder}
              style={[styles.input, styles.passwordInput, passwordFocused && styles.inputFocused]}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((c) => !c)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          {/* Olvidaste contraseña */}
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Error de servidor */}
          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* Botón principal */}
          <PrimaryButton
            title="Iniciar Sesión"
            icon="›"
            onPress={onSubmit}
            loading={loading}
          />

          {/* Registro */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              ¿No tenés una cuenta?{' '}
              <Text style={styles.registerStrong}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info card de membresía */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ⓘ</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoStrong}>Exclusivo para Miembros: </Text>
            Para pujar por piezas de alta gama o ver tu colección privada,
            se requiere un perfil verificado.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },

  // ── Decoraciones de fondo ──────────────────────────────────────────────────
  decoCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: palette.decoCircle1,
  },
  decoCircle2: {
    position: 'absolute',
    bottom: 160,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: palette.decoCircle2,
  },

  // ── Layout general ─────────────────────────────────────────────────────────
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: 'center',
  },

  // ── Header / marca ─────────────────────────────────────────────────────────
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  brand: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },

  // ── Logo ───────────────────────────────────────────────────────────────────
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 12,
  },
  logoBox: {
    marginBottom: 12,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 36,
  },

  // ── Hero text ──────────────────────────────────────────────────────────────
  title: {
    color: palette.text,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: palette.mutedLight,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 260,
  },

  // ── Formulario ─────────────────────────────────────────────────────────────
  form: {
    width: '100%',
  },
  label: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  labelSpacing: {
    marginTop: 20,
  },

  // ── Inputs ─────────────────────────────────────────────────────────────────
  inputWrapper: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: palette.field,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapperFocus: {
    backgroundColor: palette.fieldFocus,
    borderColor: palette.borderFocus,
    // shadow iOS
    shadowColor: palette.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    // shadow Android
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: palette.danger,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: palette.text,
    fontWeight: '500',
  },
  inputFocused: {
    color: palette.text,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    paddingHorizontal: 14,
  },
  eyeIcon: {
    fontSize: 16,
  },

  errorText: {
    color: palette.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },

  // ── Forgot password ────────────────────────────────────────────────────────
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 28,
  },
  forgotText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Server error ───────────────────────────────────────────────────────────
  serverErrorBox: {
    backgroundColor: palette.dangerBg,
    borderWidth: 1,
    borderColor: palette.dangerBorder,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  serverErrorText: {
    color: palette.dangerText,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Botón principal ────────────────────────────────────────────────────────
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  buttonArrow: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },

  // ── Registro ───────────────────────────────────────────────────────────────
  registerLink: {
    marginTop: 28,
    alignItems: 'center',
  },
  registerText: {
    color: palette.mutedLight,
    fontSize: 14,
  },
  registerStrong: {
    color: palette.primary,
    fontWeight: '900',
  },

  // ── Info card ──────────────────────────────────────────────────────────────
  infoCard: {
    width: '100%',
    backgroundColor: palette.infoBg,
    borderRadius: 14,
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
