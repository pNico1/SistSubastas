import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import TextField from '../components/TextField';
import PickerField from '../components/PickerField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { paisesApi } from '../api/endpoints';
import { colors, spacing } from '../theme';

// Etapa 1 del registro: el postor ingresa sus datos y queda pendiente de
// verificacion. El backend devuelve un token (en dev) para completar la etapa 2.
export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    domicilio: '',
    paisOrigenId: null,
    email: '',
  });
  const [paises, setPaises] = useState([]);
  const [paisesLoading, setPaisesLoading] = useState(true);
  const [paisesError, setPaisesError] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function loadPaises() {
    setPaisesError(false);
    setPaisesLoading(true);
    try {
      const data = await paisesApi.listar();
      setPaises(data || []);
    } catch (e) {
      setPaisesError(true);
    } finally {
      setPaisesLoading(false);
    }
  }

  useEffect(() => {
    loadPaises();
  }, []);

  function validate() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio';
    if (!form.documento.trim()) e.documento = 'El documento es obligatorio';
    if (form.paisOrigenId == null) e.paisOrigenId = 'Elegi tu pais de origen';
    if (!form.email.trim()) e.email = 'El email es obligatorio';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Email invalido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        documento: form.documento.trim(),
        domicilio: form.domicilio.trim() || null,
        paisOrigenId: form.paisOrigenId,
        email: form.email.trim(),
      });
      // El backend devuelve el token de verificacion para completar la etapa 2.
      navigation.navigate('RegisterComplete', {
        token: res.token,
        email: form.email.trim(),
        message: res.message,
      });
    } catch (err) {
      // Mapeo de errores conocidos a campos puntuales (mejor UX).
      if (err.code === 'EMAIL_ALREADY_REGISTERED') {
        setErrors((e) => ({ ...e, email: err.message }));
      } else if (err.code === 'DOCUMENT_ALREADY_REGISTERED') {
        setErrors((e) => ({ ...e, documento: err.message }));
      } else if (err.code === 'INVALID_COUNTRY') {
        setErrors((e) => ({ ...e, paisOrigenId: err.message }));
      } else {
        setServerError(err.message || 'No se pudo crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  }

  const paisItems = paises.map((p) => ({ label: p.nombre, value: p.id }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Paso 1 de 2 · tus datos</Text>

        <View style={styles.form}>
          <TextField
            label="Nombre"
            value={form.nombre}
            onChangeText={(v) => set('nombre', v)}
            placeholder="Juan"
            error={errors.nombre}
          />
          <TextField
            label="Apellido"
            value={form.apellido}
            onChangeText={(v) => set('apellido', v)}
            placeholder="Perez"
            error={errors.apellido}
          />
          <TextField
            label="Documento"
            value={form.documento}
            onChangeText={(v) => set('documento', v)}
            keyboardType="numbers-and-punctuation"
            placeholder="30123456"
            error={errors.documento}
          />
          <TextField
            label="Domicilio (opcional)"
            value={form.domicilio}
            onChangeText={(v) => set('domicilio', v)}
            placeholder="Av. Siempreviva 742"
          />
          <PickerField
            label="Pais de origen"
            placeholder={paisesError ? 'No se pudieron cargar los paises' : 'Elegi un pais'}
            items={paisItems}
            value={form.paisOrigenId}
            onSelect={(v) => set('paisOrigenId', v)}
            loading={paisesLoading}
            error={errors.paisOrigenId}
          />
          {paisesError ? (
            <TouchableOpacity onPress={loadPaises}>
              <Text style={styles.retry}>Reintentar carga de paises</Text>
            </TouchableOpacity>
          ) : null}
          <TextField
            label="Email"
            value={form.email}
            onChangeText={(v) => set('email', v)}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tu@email.com"
            error={errors.email}
          />

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

          <Button title="Continuar" onPress={onSubmit} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Ya tengo cuenta · Iniciar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  form: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16 },
  serverError: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  retry: { color: colors.primary, marginTop: -spacing.sm, marginBottom: spacing.md, fontWeight: '600' },
  link: { color: colors.primary, textAlign: 'center', marginTop: spacing.lg, fontWeight: '600' },
});
