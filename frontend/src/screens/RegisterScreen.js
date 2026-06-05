import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Image, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import PickerField from '../components/PickerField';
import Checkbox from '../components/Checkbox';
import { useAuth } from '../context/AuthContext';
import { paisesApi } from '../api/endpoints';
import { buscarDirecciones } from '../api/geocoding';

const palette = {
  background: '#F9F5FF', surface: '#FFFFFF', field: '#E2DFFF', primary: '#0B64ED',
  text: '#2B2A51', muted: '#8B88A8', border: '#E9E5FF', danger: '#FF748D', trackOff: '#D9D4F2',
};

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

  // buscador de direccion (OpenStreetMap / Nominatim)
  const [dirQuery, setDirQuery] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [buscandoDir, setBuscandoDir] = useState(false);
  const debounceRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function loadPaises() {
    setPaisesError(false); setPaisesLoading(true);
    try { setPaises(await paisesApi.listar()); }
    catch (e) { setPaisesError(true); }
    finally { setPaisesLoading(false); }
  }
  useEffect(() => { loadPaises(); }, []);

  // Busca direcciones con debounce para respetar el limite de Nominatim.
  function onDirChange(text) {
    setDirQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) { setSugerencias([]); return; }
    debounceRef.current = setTimeout(async () => {
      setBuscandoDir(true);
      try { setSugerencias(await buscarDirecciones(text)); }
      catch (e) { setSugerencias([]); }
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
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Email invalido';
    if (!form.aceptaPrivacidad) e.aceptaPrivacidad = '1';
    if (!form.aceptaTerminos) e.aceptaTerminos = '1';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (form.paisOrigenId == null) e.paisOrigenId = 'Elegi tu pais';
    if (!form.calle.trim()) e.calle = 'Ingresa la direccion';
    if (!form.ciudad.trim()) e.ciudad = 'Ingresa la ciudad';
    if (!form.provincia.trim()) e.provincia = 'Ingresa la provincia';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e = {};
    if (!form.documento.trim()) e.documento = 'Ingresa tu numero de documento';
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

  // Elegir entre camara o galeria para subir la foto del documento.
  function pickFoto(side) {
    Alert.alert('Subir foto', '¿Como queres agregar la foto?', [
      { text: 'Camara', onPress: () => tomarFoto(side, 'camara') },
      { text: 'Galeria', onPress: () => tomarFoto(side, 'galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  async function tomarFoto(side, origen) {
    try {
      let res;
      const opts = { base64: true, quality: 0.4, allowsEditing: true };
      if (origen === 'camara') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permiso necesario', 'Habilita la camara para tomar la foto.'); return; }
        res = await ImagePicker.launchCameraAsync(opts);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permiso necesario', 'Habilita el acceso a fotos.'); return; }
        res = await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ImagePicker.MediaTypeOptions.Images });
      }
      if (!res.canceled && res.assets?.[0]?.base64) {
        set(side === 'frente' ? 'fotoFrente' : 'fotoDorso', res.assets[0].base64);
      }
    } catch (e) {
      Alert.alert('No se pudo abrir', 'Revisa los permisos de camara/fotos.');
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
    } finally {
      setLoading(false);
    }
  }

  const paisItems = paises.map((p) => ({ label: p.nombre, value: p.id }));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={back} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.brand}>Bidster</Text>
            <Text style={styles.stepLabel}>PASO {step} DE 3</Text>
          </View>

          <View style={styles.progress}>
            {[1, 2, 3].map((i) => <View key={i} style={[styles.progressSeg, i <= step && styles.progressSegOn]} />)}
          </View>

          {step === 1 && (
            <View>
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>Empecemos con tus datos personales.</Text>
              <Field label="NOMBRE" value={form.nombre} onChangeText={(v) => set('nombre', v)} placeholder="Juan" error={errors.nombre} />
              <Field label="APELLIDO" value={form.apellido} onChangeText={(v) => set('apellido', v)} placeholder="Perez" error={errors.apellido} />
              <Field label="EMAIL" value={form.email} onChangeText={(v) => set('email', v)} placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" error={errors.email} />

              <View style={{ marginTop: 8 }}>
                <Checkbox checked={form.aceptaPrivacidad} onChange={(v) => set('aceptaPrivacidad', v)} error={errors.aceptaPrivacidad}>
                  <Text style={styles.checkLabel}>
                    Acepto la <Text style={styles.link} onPress={() => Alert.alert('Politica de Privacidad', 'Tus datos se usan solo para gestionar tu cuenta y participacion en subastas.')}>Politica de Privacidad</Text>
                  </Text>
                </Checkbox>
                <Checkbox checked={form.aceptaTerminos} onChange={(v) => set('aceptaTerminos', v)} error={errors.aceptaTerminos}>
                  <Text style={styles.checkLabel}>
                    Acepto los <Text style={styles.link} onPress={() => Alert.alert('Terminos y Condiciones', 'Al registrarte aceptas las reglas de participacion y pago de la plataforma.')}>Terminos y Condiciones</Text>
                  </Text>
                </Checkbox>
              </View>

              {(errors.aceptaPrivacidad || errors.aceptaTerminos) ? (
                <Text style={styles.serverError}>Debes aceptar la politica y los terminos para continuar.</Text>
              ) : null}
              {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

              <PrimaryButton title="Continuar" onPress={next} />
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.bottomLink}>Ya tengo cuenta · Iniciar sesion</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.title}>¿Donde te encuentras?</Text>
              <Text style={styles.subtitle}>Necesitamos tu residencia para garantizar pujas seguras y legales.</Text>

              <Text style={styles.fieldLabel}>PAIS</Text>
              <PickerField
                placeholder={paisesError ? 'No se pudieron cargar los paises' : 'Elegi un pais'}
                items={paisItems} value={form.paisOrigenId}
                onSelect={(v) => set('paisOrigenId', v)} loading={paisesLoading} error={errors.paisOrigenId}
              />
              {paisesError ? <TouchableOpacity onPress={loadPaises}><Text style={styles.retry}>Reintentar carga de paises</Text></TouchableOpacity> : null}

              {/* Buscador de direccion (OpenStreetMap) */}
              <Text style={[styles.fieldLabel, { marginTop: 6 }]}>BUSCAR DIRECCION</Text>
              <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔎</Text>
                <TextInput
                  value={dirQuery} onChangeText={onDirChange}
                  placeholder="Escribi y elegi tu direccion" placeholderTextColor="#B8B3D8"
                  style={styles.searchInput}
                />
                {buscandoDir ? <ActivityIndicator color={palette.primary} /> : null}
              </View>
              {sugerencias.map((s) => (
                <TouchableOpacity key={String(s.id)} style={styles.sugRow} onPress={() => elegirSugerencia(s)}>
                  <Text style={styles.sugText} numberOfLines={2}>{s.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={{ height: 8 }} />
              <Field label="DIRECCION" value={form.calle} onChangeText={(v) => set('calle', v)} placeholder="Calle y numero" error={errors.calle} />
              <Field label="CIUDAD" value={form.ciudad} onChangeText={(v) => set('ciudad', v)} placeholder="Ciudad" error={errors.ciudad} />
              <Field label="PROVINCIA / ESTADO" value={form.provincia} onChangeText={(v) => set('provincia', v)} placeholder="Provincia" error={errors.provincia} />
              <Field label="CODIGO POSTAL (opcional)" value={form.zip} onChangeText={(v) => set('zip', v)} placeholder="1234" keyboardType="numbers-and-punctuation" />

              {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
              <PrimaryButton title="Continuar" onPress={next} />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.title}>Verificacion de Identidad</Text>
              <Text style={styles.subtitle}>Ingresa tu documento y sube una foto clara de tu identificacion oficial.</Text>

              <Field label="NUMERO DE DOCUMENTO" value={form.documento} onChangeText={(v) => set('documento', v)} placeholder="30123456" keyboardType="number-pad" error={errors.documento} />

              <UploadCard titulo="Frente del Documento" sub="Toca para subir o tomar foto" icon="🪪" base64={form.fotoFrente} onPress={() => pickFoto('frente')} />
              <UploadCard titulo="Dorso del Documento" sub="Asegurate de que el texto sea legible" icon="💳" base64={form.fotoDorso} onPress={() => pickFoto('dorso')} />

              {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
              <PrimaryButton title="Finalizar Registro ›" onPress={finalizar} loading={loading} />
              <TouchableOpacity onPress={finalizar} disabled={loading}>
                <Text style={styles.bottomLink}>Lo hare mas tarde (subo las fotos despues)</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, error, ...props }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.input, error && styles.inputError]}>
        <TextInput placeholderTextColor="#B8B3D8" style={styles.inputText} {...props} />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function UploadCard({ titulo, sub, icon, base64, onPress }) {
  const cargada = !!base64;
  return (
    <TouchableOpacity style={[styles.upload, cargada && styles.uploadDone]} onPress={onPress} activeOpacity={0.8}>
      {cargada ? <Image source={{ uri: `data:image/jpeg;base64,${base64}` }} style={styles.uploadPreview} /> : <Text style={styles.uploadIcon}>{icon}</Text>}
      <Text style={styles.uploadTitle}>{titulo}</Text>
      <Text style={styles.uploadSub}>{cargada ? '✓ Foto cargada · toca para cambiar' : sub}</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({ title, onPress, loading }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={loading} style={[styles.button, loading && { opacity: 0.6 }]}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backArrow: { fontSize: 30, color: palette.primary, fontWeight: '800', width: 28 },
  brand: { color: palette.primary, fontSize: 18, fontWeight: '900', flex: 1 },
  stepLabel: { color: palette.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  progressSeg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: palette.trackOff },
  progressSegOn: { backgroundColor: palette.primary },
  title: { fontSize: 28, fontWeight: '900', color: palette.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: palette.muted, marginBottom: 22 },
  fieldLabel: { color: palette.text, fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  input: { height: 52, borderRadius: 10, backgroundColor: palette.field, borderWidth: 1, borderColor: 'transparent', justifyContent: 'center', paddingHorizontal: 14 },
  inputError: { borderColor: palette.danger },
  inputText: { fontSize: 15, color: palette.text, paddingVertical: 0 },
  errorText: { color: palette.danger, fontSize: 13, marginTop: 6 },
  serverError: { color: palette.danger, textAlign: 'center', marginBottom: 14 },
  retry: { color: palette.primary, fontWeight: '700', marginTop: -8, marginBottom: 16 },
  checkLabel: { color: palette.text, fontSize: 14, lineHeight: 20 },
  link: { color: palette.primary, fontWeight: '700', textDecorationLine: 'underline' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 10, borderWidth: 1, borderColor: palette.border, paddingHorizontal: 12, height: 50, marginBottom: 6 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: palette.text, paddingVertical: 0 },
  sugRow: { backgroundColor: palette.surface, borderRadius: 8, borderWidth: 1, borderColor: palette.border, padding: 12, marginBottom: 6 },
  sugText: { color: palette.text, fontSize: 13 },
  upload: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1.5, borderColor: palette.border, borderStyle: 'dashed', padding: 22, alignItems: 'center', marginBottom: 16 },
  uploadDone: { borderStyle: 'solid', borderColor: palette.primary },
  uploadIcon: { fontSize: 30, marginBottom: 10 },
  uploadPreview: { width: 90, height: 60, borderRadius: 8, marginBottom: 10 },
  uploadTitle: { fontSize: 15, fontWeight: '800', color: palette.text },
  uploadSub: { fontSize: 12, color: palette.muted, marginTop: 4, textAlign: 'center' },
  button: { height: 54, borderRadius: 12, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: palette.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  bottomLink: { color: palette.muted, textAlign: 'center', marginTop: 16, fontWeight: '600' },
});
