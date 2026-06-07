import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Image, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
  Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PickerField from '../components/PickerField';
import Checkbox from '../components/Checkbox';
import { useAuth } from '../context/AuthContext';
import { paisesApi } from '../api/endpoints';
import { buscarDirecciones } from '../api/geocoding';

// ─── Paleta Bidster ────────────────────────────────────────────────────────────
const p = {
  background:   '#F9F5FF',
  surface:      '#FFFFFF',
  surfaceLow:   '#F2EFFF',
  field:        '#E2DFFF',
  fieldFocus:   '#FFFFFF',
  container:    '#E9E5FF',
  primary:      '#0846ED',
  primaryDim:   '#859AFF',
  text:         '#2B2A51',
  muted:        '#585781',
  border:       '#ABA9D7',
  danger:       '#B41340',
  dangerLight:  '#F74B6D',
  white:        '#FFFFFF',
  trackOff:     '#DCD9FF',
};

const GRADIENT = [p.primary, p.primaryDim];

// ─── Componentes de apoyo ───────────────────────────────────────────────────────

/** Botón principal con gradiente kinético */
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
            <ActivityIndicator color={p.white} />
          ) : (
            <View style={styles.btnRow}>
              <Text style={styles.buttonText}>{title}</Text>
              {icon ? <Text style={styles.btnIcon}>{icon}</Text> : null}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Campo de texto estilizado */
function Field({ label, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          placeholderTextColor={p.border}
          style={styles.inputText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/** Card de carga de foto de documento */
function UploadCard({ titulo, sub, icon, base64, onPress }) {
  const loaded = !!base64;
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={[styles.upload, loaded && styles.uploadDone]}
      >
        {loaded ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${base64}` }}
            style={styles.uploadPreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.uploadIconWrap}>
            <Image source={icon} style={{ width: 40, height: 40 }} resizeMode="contain" />
          </View>
        )}
        <Text style={styles.uploadTitle}>{titulo}</Text>
        <Text style={styles.uploadSub}>
          {loaded ? '✓ Foto cargada · toca para cambiar' : sub}
        </Text>
        {loaded && (
          <View style={styles.uploadBadge}>
            <Text style={styles.uploadBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Barra de progreso en 3 segmentos */
function ProgressBar({ step }) {
  return (
    <View style={styles.progress}>
      {[1, 2, 3].map((i) =>
        i <= step ? (
          <LinearGradient
            key={i}
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressSeg}
          />
        ) : (
          <View key={i} style={[styles.progressSeg, { backgroundColor: p.trackOff }]} />
        ),
      )}
    </View>
  );
}

/** Badge de info (paso 1) */
function InfoBadge({ icon, title, subtitle }) {
  return (
    <View style={styles.infoBadge}>
      <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.infoBadgeIcon}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoBadgeTitle}>{title}</Text>
        <Text style={styles.infoBadgeSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

/** Badge de seguridad (paso 3) */
function SecurityBadge() {
  return (
    <View style={styles.secBadge}>
    </View>
  );
}

// ─── Pantalla principal ─────────────────────────────────────────────────────────

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '',
    aceptaPrivacidad: false, aceptaTerminos: false,
    paisOrigenId: null, calle: '', ciudad: '', provincia: '', zip: '',
    documento: '', fotoFrente: null, fotoDorso: null,
  });

  const [paises, setPaises] = useState([]);
  const [paisesLoading, setPaisesLoading] = useState(true);
  const [paisesError, setPaisesError] = useState(false);

  const [dirQuery, setDirQuery] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscandoDir, setBuscandoDir] = useState(false);
  const debounceRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(18);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function loadPaises() {
    setPaisesError(false); setPaisesLoading(true);
    try { setPaises(await paisesApi.listar()); }
    catch { setPaisesError(true); }
    finally { setPaisesLoading(false); }
  }
  useEffect(() => { loadPaises(); }, []);

  function onDirChange(text) {
    setDirQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) { setSugerencias([]); return; }
    debounceRef.current = setTimeout(async () => {
      setBuscandoDir(true);
      try { setSugerencias(await buscarDirecciones(text)); }
      catch { setSugerencias([]); }
      finally { setBuscandoDir(false); }
    }, 700);
  }

  function elegirSugerencia(s) {
    setForm((f) => ({ ...f, calle: s.calle, ciudad: s.ciudad, provincia: s.provincia, zip: s.zip }));
    setDirQuery(s.label);
    setSugerencias([]);
  }

  function validateStep1() {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio';
    if (!form.email.trim()) e.email = 'El email es obligatorio';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.aceptaPrivacidad) e.aceptaPrivacidad = '1';
    if (!form.aceptaTerminos) e.aceptaTerminos = '1';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (form.paisOrigenId == null) e.paisOrigenId = 'Elegí tu país';
    if (!form.calle.trim()) e.calle = 'Ingresá la dirección';
    if (!form.ciudad.trim()) e.ciudad = 'Ingresá la ciudad';
    if (!form.provincia.trim()) e.provincia = 'Ingresá la provincia';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e = {};
    if (!form.documento.trim()) e.documento = 'Ingresá tu número de documento';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    setServerError(null);
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function back() {
    setServerError(null); setErrors({});
    if (step > 1) setStep(step - 1); else navigation.goBack();
  }

  function pickFoto(side) {
    Alert.alert('Subir foto', '¿Cómo querés agregar la foto?', [
      { text: 'Cámara', onPress: () => tomarFoto(side, 'camara') },
      { text: 'Galería', onPress: () => tomarFoto(side, 'galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function tomarFoto(side, origen) {
    try {
      let res;
      const opts = { base64: true, quality: 0.4, allowsEditing: true };
      if (origen === 'camara') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permiso necesario', 'Habilitá la cámara.'); return; }
        res = await ImagePicker.launchCameraAsync(opts);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permiso necesario', 'Habilitá el acceso a fotos.'); return; }
        res = await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ImagePicker.MediaTypeOptions.Images });
      }
      if (!res.canceled && res.assets?.[0]?.base64)
        set(side === 'frente' ? 'fotoFrente' : 'fotoDorso', res.assets[0].base64);
    } catch {
      Alert.alert('No se pudo abrir', 'Revisá los permisos de cámara/fotos.');
    }
  }

  async function finalizar() {
    setServerError(null);
    if (!validateStep3()) return;
    setLoading(true);
    try {
      const domicilio = [form.calle, form.ciudad, form.provincia, form.zip ? `CP ${form.zip}` : '']
        .map((x) => x.trim()).filter(Boolean).join(', ');
      const res = await register({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        documento: form.documento.trim(),
        domicilio: domicilio || null,
        paisOrigenId: form.paisOrigenId,
        email: form.email.trim(),
        fotoDocFrente: form.fotoFrente,
        fotoDocDorso: form.fotoDorso,
      });
      navigation.replace('VerifyEmail', {
        email: form.email.trim(),
        provisionalPassword: res.provisionalPassword,
        devCode: res.devCode,
      });
    } catch (err) {
      if (err.code === 'EMAIL_ALREADY_REGISTERED') { setStep(1); setErrors({ email: err.message }); }
      else if (err.code === 'DOCUMENT_ALREADY_REGISTERED') { setStep(3); setErrors({ documento: err.message }); }
      else if (err.code === 'INVALID_COUNTRY') { setStep(2); setErrors({ paisOrigenId: err.message }); }
      else setServerError(err.message || 'No se pudo completar el registro');
    } finally { setLoading(false); }
  }

  const paisItems = paises.map((p) => ({ label: p.nombre, value: p.id }));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Top bar ────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={back}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color={p.primary} />
          </TouchableOpacity>
          <Text style={styles.brand}>Bidster</Text>
          <Text style={styles.stepLabel}>PASO {step} DE 3</Text>
        </View>

        <ProgressBar step={step} />

        {/* ── Contenido animado ──────────────────────────────────────── */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ═══════════ PASO 1 ═══════════ */}
            {step === 1 && (
              <View>
                <Text style={styles.title}>
                  Comenzá tu{'\n'}<Text style={styles.titleAccent}>legado.</Text>
                </Text>
                <Text style={styles.subtitle}>
                  Ingresá tus datos personales para explorar la galería.
                </Text>

                <Field
                  label="NOMBRE"
                  value={form.nombre}
                  onChangeText={(v) => set('nombre', v)}
                  placeholder="ej. Julián"
                  error={errors.nombre}
                />
                <Field
                  label="APELLIDO"
                  value={form.apellido}
                  onChangeText={(v) => set('apellido', v)}
                  placeholder="ej. Avery"
                  error={errors.apellido}
                />
                <Field
                  label="EMAIL"
                  value={form.email}
                  onChangeText={(v) => set('email', v)}
                  placeholder="ej. julian@ejemplo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={errors.email}
                />

                <View style={{ marginTop: 4, marginBottom: 20 }}>
                  <Checkbox checked={form.aceptaPrivacidad} onChange={(v) => set('aceptaPrivacidad', v)} error={errors.aceptaPrivacidad}>
                    <Text style={styles.checkLabel}>
                      Acepto la{' '}
                      <Text
                        style={styles.link}
                        onPress={() => Alert.alert('Política de Privacidad', 'Tus datos se usan solo para gestionar tu cuenta y participación en subastas.')}
                      >
                        Política de Privacidad
                      </Text>
                    </Text>
                  </Checkbox>
                  <Checkbox checked={form.aceptaTerminos} onChange={(v) => set('aceptaTerminos', v)} error={errors.aceptaTerminos}>
                    <Text style={styles.checkLabel}>
                      Acepto los{' '}
                      <Text
                        style={styles.link}
                        onPress={() => Alert.alert('Términos y Condiciones', 'Al registrarte aceptás las reglas de participación y pago de la plataforma.')}
                      >
                        Términos y Condiciones
                      </Text>
                    </Text>
                  </Checkbox>
                  {(errors.aceptaPrivacidad || errors.aceptaTerminos) && (
                    <Text style={styles.serverError}>
                      Debés aceptar la política y los términos para continuar.
                    </Text>
                  )}
                </View>

                <InfoBadge
                  icon="🪪"
                  title="Verificación de Identidad"
                  subtitle="Tu nombre será visible en lotes de alto valor."
                />

                {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
                <PrimaryButton title="Continuar" icon="›" onPress={next} />
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.bottomLink}>Ya tengo cuenta · Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ═══════════ PASO 2 ═══════════ */}
            {step === 2 && (
              <View>
                <Text style={styles.title}>
                  ¿Dónde <Text style={styles.titleAccent}>estás?</Text>
                </Text>
                <Text style={styles.subtitle}>
                  Necesitamos tu residencia para garantizar pujas seguras y legales.
                </Text>

                <Text style={styles.fieldLabel}>PAÍS</Text>
                <PickerField
                  placeholder={paisesError ? 'No se pudieron cargar los países' : 'Elegí un país'}
                  items={paisItems}
                  value={form.paisOrigenId}
                  onSelect={(v) => set('paisOrigenId', v)}
                  loading={paisesLoading}
                  error={errors.paisOrigenId}
                />
                {paisesError && (
                  <TouchableOpacity onPress={loadPaises}>
                    <Text style={styles.retry}>↻ Reintentar carga de países</Text>
                  </TouchableOpacity>
                )}

                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>BUSCAR DIRECCIÓN</Text>
                <View style={[styles.searchWrap, buscandoDir && { borderColor: p.primary }]}>
                  <Text style={styles.searchIcon}>📍</Text>
                  <TextInput
                    value={dirQuery}
                    onChangeText={onDirChange}
                    placeholder="Escribí y elegí tu dirección"
                    placeholderTextColor={p.border}
                    style={styles.searchInput}
                  />
                  {buscandoDir && <ActivityIndicator color={p.primary} size="small" />}
                </View>

                {sugerencias.length > 0 && (
                  <View style={styles.sugContainer}>
                    {sugerencias.map((s) => (
                      <TouchableOpacity
                        key={String(s.id)}
                        style={styles.sugRow}
                        onPress={() => elegirSugerencia(s)}
                      >
                        <Text style={styles.sugDot}>·</Text>
                        <Text style={styles.sugText} numberOfLines={2}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={{ height: 4 }} />
                <Field label="DIRECCIÓN" value={form.calle} onChangeText={(v) => set('calle', v)} placeholder="Calle y número" error={errors.calle} />
                <Field label="CIUDAD" value={form.ciudad} onChangeText={(v) => set('ciudad', v)} placeholder="Ciudad" error={errors.ciudad} />
                <Field label="PROVINCIA / ESTADO" value={form.provincia} onChangeText={(v) => set('provincia', v)} placeholder="Provincia" error={errors.provincia} />
                <Field label="CÓDIGO POSTAL (opcional)" value={form.zip} onChangeText={(v) => set('zip', v)} placeholder="1234" keyboardType="numbers-and-punctuation" />

                <View style={styles.encryptedNote}>
                  <Text style={styles.encryptedNoteText}>
                    🔒 Tus datos están cifrados según nuestra Política de Privacidad.
                  </Text>
                </View>

                {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
                <PrimaryButton title="Continuar" icon="›" onPress={next} />
              </View>
            )}

            {/* ═══════════ PASO 3 ═══════════ */}
            {step === 3 && (
              <View>
                <Text style={styles.title}>Verificación{'\n'}<Text style={styles.titleAccent}>de Identidad</Text></Text>
                <Text style={styles.subtitle}>
                  Para garantizar un entorno seguro, subí una foto clara de tu identificación oficial.
                </Text>

                <Field
                  label="NÚMERO DE DOCUMENTO"
                  value={form.documento}
                  onChangeText={(v) => set('documento', v)}
                  placeholder="30123456"
                  keyboardType="number-pad"
                  error={errors.documento}
                />

                <View style={styles.uploadGrid}>
                  <UploadCard
                    titulo="Frente del documento"
                    sub="Tocá para subir o tomar foto"
                    icon={require('../assets/image (1).jpg')}
                    base64={form.fotoFrente}
                    onPress={() => pickFoto('frente')}
                  />
                  <UploadCard
                    titulo="Dorso del documento"
                    sub="Tocá para subir o tomar foto"
                    icon={require('../assets/dniAtras.png')}
                    base64={form.fotoAtras}
                    onPress={() => pickFoto('atras')}
                  />
                </View>

                <SecurityBadge />

                {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
                <PrimaryButton title="Finalizar Registro" icon="›" onPress={finalizar} loading={loading} />
                <TouchableOpacity onPress={finalizar} disabled={loading}>
                  <Text style={styles.bottomLink}>Lo haré más tarde (subo las fotos después)</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.background },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: p.container,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  brand: {
    color: p.primary, fontSize: 20, fontWeight: '900',
    fontStyle: 'italic', letterSpacing: -0.5, flex: 1,
  },
  stepLabel: { color: p.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  // Progress
  progress: { flexDirection: 'row', gap: 6, marginHorizontal: 20, marginBottom: 20 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },

  // Scroll
  container: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48 },

  // Títulos
  title: { fontSize: 34, fontWeight: '900', color: p.text, lineHeight: 40, marginBottom: 10 },
  titleAccent: { color: p.primary },
  subtitle: { fontSize: 15, lineHeight: 22, color: p.muted, marginBottom: 28 },

  // Campos
  fieldLabel: {
    color: p.text, fontSize: 10, fontWeight: '900',
    letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase',
  },
  input: {
    height: 54, borderRadius: 10,
    backgroundColor: p.field,
    borderWidth: 1.5, borderColor: 'transparent',
    justifyContent: 'center', paddingHorizontal: 16,
  },
  inputFocused: { backgroundColor: p.fieldFocus, borderColor: p.primary + '40' },
  inputError: { borderColor: p.dangerLight },
  inputText: { fontSize: 15, color: p.text, paddingVertical: 0 },
  errorText: { color: p.danger, fontSize: 12, marginTop: 5, fontWeight: '600' },
  serverError: { color: p.danger, textAlign: 'center', marginVertical: 12, fontWeight: '600' },
  retry: { color: p.primary, fontWeight: '700', marginTop: -6, marginBottom: 14, fontSize: 13 },

  // Checkbox
  checkLabel: { color: p.text, fontSize: 14, lineHeight: 20 },
  link: { color: p.primary, fontWeight: '800', textDecorationLine: 'underline' },

  // Info badge (paso 1)
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: p.surfaceLow, borderRadius: 16,
    padding: 16, marginBottom: 20,
  },
  infoBadgeIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  infoBadgeTitle: { fontSize: 14, fontWeight: '800', color: p.text },
  infoBadgeSub: { fontSize: 12, color: p.muted, marginTop: 2 },

  // Buscador de dirección
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: p.surface, borderRadius: 10,
    borderWidth: 1.5, borderColor: p.border,
    paddingHorizontal: 14, height: 54, marginBottom: 4,
  },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: p.text, paddingVertical: 0 },
  sugContainer: {
    backgroundColor: p.surface, borderRadius: 10,
    borderWidth: 1, borderColor: p.border,
    marginBottom: 12, overflow: 'hidden',
  },
  sugRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: p.border + '55',
  },
  sugDot: { color: p.primary, fontWeight: '900', marginRight: 8, fontSize: 18, lineHeight: 20 },
  sugText: { flex: 1, color: p.text, fontSize: 13, lineHeight: 18 },

  // Nota cifrado (paso 2)
  encryptedNote: {
    backgroundColor: p.surfaceLow, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8,
  },
  encryptedNoteText: { color: p.muted, fontSize: 12, fontWeight: '600' },

  // Upload cards (paso 3)
  uploadGrid: { gap: 14, marginBottom: 20 },
  upload: {
    backgroundColor: p.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: p.border,
    borderStyle: 'dashed', padding: 24,
    alignItems: 'center',
  },
  uploadDone: { borderStyle: 'solid', borderColor: p.primary, backgroundColor: p.surfaceLow },
  uploadIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: p.container,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  uploadIconEmoji: { fontSize: 28 },
  uploadPreview: { width: 100, height: 68, borderRadius: 8, marginBottom: 12 },
  uploadTitle: { fontSize: 15, fontWeight: '800', color: p.text },
  uploadSub: { fontSize: 12, color: p.muted, marginTop: 5, textAlign: 'center' },
  uploadBadge: {
    position: 'absolute', top: 12, right: 12,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: p.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadBadgeText: { color: p.white, fontSize: 13, fontWeight: '900' },

  // Security badge (paso 3)
  secBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: p.surfaceLow, borderRadius: 999,
    alignSelf: 'center', marginBottom: 20,
  },
  secBadgeText: { fontSize: 11, fontWeight: '800', color: p.muted, letterSpacing: 1 },

  // Botón principal
  button: {
    height: 56, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: p.primary, shadowOpacity: 0.35,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonText: { color: p.white, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  btnIcon: { color: p.white, fontSize: 22, fontWeight: '900', lineHeight: 24 },
  bottomLink: { color: p.muted, textAlign: 'center', marginTop: 18, fontWeight: '600', fontSize: 13 },
});
