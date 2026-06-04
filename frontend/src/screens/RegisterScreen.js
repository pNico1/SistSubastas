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

const palette = {
  background: '#F9F5FF',
  field: '#EDE9FF',
  primary: '#0B64ED',
  primarySoft: '#6D8CFF',
  text: '#2B2A51',
  muted: '#8B88A8',
  line: '#E8E3FF',
  border: '#CFC8F5',
  danger: '#FF748D',
  white: '#FFFFFF',
};

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
  });

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.nombre.trim()) {
      nextErrors.nombre = 'El nombre es obligatorio';
    }

    if (!form.apellido.trim()) {
      nextErrors.apellido = 'El apellido es obligatorio';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      nextErrors.email = 'Correo electrónico inválido';
    }

    if (!acceptedTerms) {
      nextErrors.terms = 'Debes aceptar los Términos y Condiciones';
    }

    if (!acceptedPrivacy) {
      nextErrors.privacy = 'Debes aceptar la Política de Privacidad';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit() {
    setServerError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      /*
        Esta pantalla es el Paso 1 de 3.
        Acá se guardan los datos básicos y se avanza al próximo paso.

        Cambiá 'RegisterStep2' por el nombre real de tu pantalla siguiente
        en el navigator.
      */

      navigation.navigate('RegisterStep2', {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
      });
    } catch (err) {
      setServerError(err?.message || 'No se pudo continuar con el registro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <Text style={styles.brand}>Bidster</Text>

            <Text style={styles.stepText}>Paso 1 de 3</Text>
          </View>

          <View style={styles.progressWrapper}>
            <View style={[styles.progressLine, styles.progressActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressLine} />
          </View>

          <Text style={styles.title}>
            Comienza tu <Text style={styles.titleBlue}>legado.</Text>
          </Text>

          <Text style={styles.subtitle}>
            Ingresa tus datos básicos para comenzar a explorar.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>NOMBRE</Text>

            <TextInput
              value={form.nombre}
              onChangeText={(value) => set('nombre', value)}
              placeholder="ej. Julian"
              placeholderTextColor="#C7C1E6"
              style={[styles.input, errors.nombre && styles.inputError]}
            />

            {errors.nombre ? (
              <Text style={styles.errorText}>{errors.nombre}</Text>
            ) : null}

            <Text style={styles.label}>APELLIDO</Text>

            <TextInput
              value={form.apellido}
              onChangeText={(value) => set('apellido', value)}
              placeholder="ej. Avery"
              placeholderTextColor="#C7C1E6"
              style={[styles.input, errors.apellido && styles.inputError]}
            />

            {errors.apellido ? (
              <Text style={styles.errorText}>{errors.apellido}</Text>
            ) : null}

            <Text style={styles.label}>
              CORREO ELECTRÓNICO <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              value={form.email}
              onChangeText={(value) => set('email', value)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="ej. julian@ejemplo.com"
              placeholderTextColor="#C7C1E6"
              style={[styles.input, errors.email && styles.inputError]}
            />

            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            <TouchableOpacity
              onPress={() => setAcceptedTerms((current) => !current)}
              style={styles.checkboxRow}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                {acceptedTerms ? <Text style={styles.check}>✓</Text> : null}
              </View>

              <Text style={styles.checkboxText}>
                Acepto los{' '}
                <Text style={styles.linkText}>Términos y Condiciones</Text>
              </Text>
            </TouchableOpacity>

            {errors.terms ? (
              <Text style={styles.checkboxError}>{errors.terms}</Text>
            ) : null}

            <TouchableOpacity
              onPress={() => setAcceptedPrivacy((current) => !current)}
              style={styles.checkboxRow}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, acceptedPrivacy && styles.checkboxActive]}>
                {acceptedPrivacy ? <Text style={styles.check}>✓</Text> : null}
              </View>

              <Text style={styles.checkboxText}>
                He leído y acepto la{' '}
                <Text style={styles.linkText}>Política de Privacidad</Text>
              </Text>
            </TouchableOpacity>

            {errors.privacy ? (
              <Text style={styles.checkboxError}>{errors.privacy}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.bottomContent}>
          {serverError ? (
            <Text style={styles.serverError}>{serverError}</Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSubmit}
            disabled={loading}
            style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continuar →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={styles.loginStrong}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
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

  container: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },

  topContent: {
    width: '100%',
  },

  header: {
    width: '100%',
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  backIcon: {
    color: palette.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: -2,
  },

  brand: {
    color: palette.primary,
    fontSize: 22,
    fontWeight: '900',
    flex: 1,
  },

  stepText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '900',
  },

  progressWrapper: {
    flexDirection: 'row',
    marginTop: 18,
    marginBottom: 28,
  },

  progressLine: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: palette.line,
    marginRight: 9,
  },

  progressActive: {
    backgroundColor: palette.primary,
  },

  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    marginBottom: 8,
  },

  titleBlue: {
    color: palette.primary,
  },

  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 28,
  },

  form: {
    width: '100%',
  },

  label: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 9,
    marginTop: 15,
  },

  required: {
    color: palette.danger,
  },

  input: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: palette.field,
    color: palette.text,
    paddingHorizontal: 18,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  inputError: {
    borderColor: palette.danger,
  },

  errorText: {
    color: palette.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  checkboxActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },

  check: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900',
  },

  checkboxText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  linkText: {
    color: palette.primary,
    fontWeight: '800',
  },

  checkboxError: {
    color: palette.danger,
    fontSize: 11,
    marginTop: 5,
    marginLeft: 30,
  },

  bottomContent: {
    width: '100%',
    marginTop: 40,
  },

  serverError: {
    color: palette.danger,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },

  continueButton: {
    width: '100%',
    height: 58,
    borderRadius: 12,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },

  continueButtonDisabled: {
    backgroundColor: palette.primarySoft,
    opacity: 0.8,
  },

  continueButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900',
  },

  loginLink: {
    alignItems: 'center',
    marginTop: 14,
  },

  loginText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  loginStrong: {
    color: palette.primary,
    fontWeight: '900',
  },
});