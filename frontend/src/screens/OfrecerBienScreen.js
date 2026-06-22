import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image, Alert, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { productosApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { goBackOrReturnTo } from '../navigationUtils';
import BottomNavBar from '../components/BottomNavBar';
import Button from '../components/Button';
import TopAppBar from '../components/TopAppBar';

const MIN_FOTOS = 6;
const MAX_FOTOS = 8;

const p = {
  background:    '#F9F5FF',
  surface:       '#FFFFFF',
  surfaceLow:    '#F2EFFF',
  container:     '#E9E5FF',
  containerLow:  '#F2EFFF',
  primary:       '#0846ED',
  primaryFaint:  'rgba(8,70,237,0.08)',
  text:          '#2B2A51',
  muted:         '#585781',
  border:        'rgba(171,169,215,0.35)',
  borderDash:    '#ABA9D7',
  danger:        '#B41340',
  white:         '#FFFFFF',
};

// Campo de texto interno con el estilo del diseño HTML
function Field({ label, error, required, multiline, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}{required ? <Text style={{ color: p.danger }}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.fieldInput,
          focused && styles.fieldInputFocused,
          error && styles.fieldInputError,
          multiline && { height: 96, textAlignVertical: 'top', paddingTop: 14 },
        ]}
        placeholderTextColor={p.borderDash}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// Sección expandible de detalles adicionales
function ExpandableSection({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.expandCard}>
      <TouchableOpacity style={styles.expandHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.75}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialIcons name="info-outline" size={20} color={p.primary} />
          <Text style={styles.expandTitle}>Detalles adicionales</Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={22}
          color={p.muted}
        />
      </TouchableOpacity>
      {open && <View style={styles.expandBody}>{children}</View>}
    </View>
  );
}

export default function OfrecerBienScreen({ navigation, route }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const pendingVerification = user?.estado === 'pending_verification';

  const [form, setForm] = useState({
    descripcionCatalogo: '',
    descripcionCompleta: '',
    nombreArtista: '',
    fechaObra: '',
    historia: '',
    precioBase: '',
    moneda: 'ARS',
    cantidad: '1',
  });
  const [fotos, setFotos] = useState([]);
  const [terminos, setTerminos] = useState(false);
  const [terminosCuracion, setTerminosCuracion] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function agregarFotos() {
    setServerError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.4,
      allowsMultipleSelection: true,
      selectionLimit: MAX_FOTOS,
    });
    if (result.canceled) return;
    const nuevas = (result.assets || []).filter((a) => a.base64).map((a) => ({ uri: a.uri, base64: a.base64 }));
    setFotos((prev) => {
      const combinadas = [...prev, ...nuevas].slice(0, MAX_FOTOS);
      if (prev.length + nuevas.length > MAX_FOTOS)
        Alert.alert('Máximo de fotos', `Podés subir hasta ${MAX_FOTOS} fotos.`);
      return combinadas;
    });
    setErrors((e) => ({ ...e, fotos: undefined }));
  }

  function quitarFoto(index) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const e = {};
    if (!form.descripcionCatalogo.trim()) e.descripcionCatalogo = 'Poné un título para el bien';
    if (!form.precioBase.trim()) e.precioBase = 'Ingresá un precio base';
    if (fotos.length < MIN_FOTOS) e.fotos = `Subí al menos ${MIN_FOTOS} fotos (${fotos.length}/${MIN_FOTOS})`;
    if (!terminos) e.terminos = 'Tenés que declarar que el bien te pertenece';
    if (!terminosCuracion) e.terminosCuracion = 'Tenés que aceptar las condiciones de curaduría';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    setServerError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await productosApi.crear({
        descripcionCatalogo: form.descripcionCatalogo.trim(),
        descripcionCompleta: form.descripcionCompleta.trim() || null,
        nombreArtista: form.nombreArtista.trim() || null,
        fechaObra: form.fechaObra.trim() || null,
        historia: form.historia.trim() || null,
        precioBase: parseFloat(form.precioBase) || null,
        moneda: form.moneda,
        cantidad: parseInt(form.cantidad) || 1,
        terminosAceptados: terminos,
        fotos: fotos.map((f) => f.base64),
      });
      Alert.alert(
        'Producto enviado',
        `${res.mensaje}. Quedó en estado "${res.estado}" con ${res.cantidadFotos} foto(s).`,
        [{ text: 'Listo', onPress: () => goBackOrReturnTo(navigation, route) }]
      );
    } catch (err) {
      if (err.code === 'NO_PHOTOS') setErrors((e) => ({ ...e, fotos: err.message }));
      else if (err.code === 'TERMS_NOT_ACCEPTED') setErrors((e) => ({ ...e, terminos: err.message }));
      else if (err.code === 'VALIDATION_ERROR' && err.fields) setErrors((e) => ({ ...e, ...err.fields }));
      else setServerError(err.message || 'No se pudo enviar el producto');
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <View style={{ flex: 1, backgroundColor: p.background }}>
        <TopAppBar navigation={navigation} />
        <View style={[styles.blocked, { paddingTop: insets.top + 80 }]}>
        <Text style={styles.blockedTitle}>Cuenta en verificación</Text>
        <Text style={styles.blockedText}>
          Tu cuenta todavía está pendiente de aprobación. Vas a poder enviar un bien cuando un administrador la verifique.
        </Text>
          <Button title="Volver al inicio" onPress={() => navigation.navigate('Bidster')} variant="accent" />
        </View>
        <BottomNavBar navigation={navigation} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <TopAppBar navigation={navigation} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Galería */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Galería de imágenes</Text>
            <Text style={styles.sectionHint}>{fotos.length}/{MAX_FOTOS} · mínimo {MIN_FOTOS}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galeria}
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            {/* Botón agregar */}
            {fotos.length < MAX_FOTOS && (
              <TouchableOpacity style={styles.galeriaAdd} onPress={agregarFotos} activeOpacity={0.75}>
                <MaterialIcons name="add-circle-outline" size={28} color={p.muted} />
                <Text style={styles.galeriaAddText}>Subir</Text>
              </TouchableOpacity>
            )}

            {/* Fotos cargadas */}
            {fotos.map((f, i) => (
              <View key={`${f.uri}-${i}`} style={styles.galeriaThumb}>
                <Image source={{ uri: f.uri }} style={styles.galeriaImg} />
                <TouchableOpacity style={styles.galeriaRemove} onPress={() => quitarFoto(i)}>
                  <MaterialIcons name="close" size={12} color={p.white} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Placeholders */}
            {Array.from({ length: Math.max(0, MIN_FOTOS - fotos.length) }).map((_, i) => (
              <View key={`ph-${i}`} style={styles.galeriaPlaceholder}>
                <MaterialIcons name="image" size={28} color="rgba(171,169,215,0.4)" />
              </View>
            ))}
          </ScrollView>
          {errors.fotos ? <Text style={styles.fieldError}>{errors.fotos}</Text> : null}

          {/* Información básica */}
          <Text style={[styles.sectionLabel, { marginTop: 28, marginBottom: 16 }]}>Información Básica</Text>

          <Field
            label="Nombre o título"
            required
            value={form.descripcionCatalogo}
            onChangeText={(v) => set('descripcionCatalogo', v)}
            placeholder="Ej: Reloj Patek Philippe Calatrava"
            error={errors.descripcionCatalogo}
          />
          <Field
            label="Descripción"
            required
            value={form.descripcionCompleta}
            onChangeText={(v) => set('descripcionCompleta', v)}
            placeholder="Detallá el estado, procedencia y características únicas..."
            multiline
            error={errors.descripcionCompleta}
          />

          {/* Precio y cantidad */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>
                Precio base sugerido<Text style={{ color: p.danger }}> *</Text>
              </Text>
              <View style={styles.precioWrap}>
                <TextInput
                  style={styles.precioInput}
                  value={form.precioBase}
                  onChangeText={(v) => set('precioBase', v)}
                  placeholder="0.00"
                  placeholderTextColor={p.borderDash}
                  keyboardType="decimal-pad"
                />
                <View style={styles.monedaToggle}>
                  {['ARS', 'USD'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => set('moneda', m)}
                      style={[styles.monedaBtn, form.moneda === m && styles.monedaBtnActive]}
                    >
                      <Text style={[styles.monedaText, form.moneda === m && { color: p.primary }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {errors.precioBase ? <Text style={styles.fieldError}>{errors.precioBase}</Text> : null}
            </View>
            <View style={{ width: 110 }}>
              <Field
                label="Cantidad"
                value={form.cantidad}
                onChangeText={(v) => set('cantidad', v)}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Detalles adicionales expandibles */}
          <ExpandableSection>
            <Field
              label="Autor o diseñador"
              value={form.nombreArtista}
              onChangeText={(v) => set('nombreArtista', v)}
              placeholder="Ej: Patek Philippe"
            />
            <Field
              label="Fecha / Época"
              value={form.fechaObra}
              onChangeText={(v) => set('fechaObra', v)}
              placeholder="Ej: 1920"
            />
            <Field
              label="Historia o contexto"
              value={form.historia}
              onChangeText={(v) => set('historia', v)}
              placeholder="De dónde viene la pieza..."
              multiline
            />
          </ExpandableSection>

          {/* Checks legales */}
          <View style={{ marginTop: 24, gap: 14 }}>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => { setTerminos((t) => !t); setErrors((e) => ({ ...e, terminos: undefined })); }}
              activeOpacity={0.75}
            >
              <View style={[styles.checkbox, terminos && styles.checkboxOn]}>
                {terminos && <MaterialIcons name="check" size={13} color={p.white} />}
              </View>
              <Text style={styles.checkText}>
                Declaro que el bien me pertenece y poseo los derechos para su comercialización.{' '}
                <Text style={{ color: p.danger }}>*</Text>
              </Text>
            </TouchableOpacity>
            {errors.terminos ? <Text style={styles.fieldError}>{errors.terminos}</Text> : null}

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => { setTerminosCuracion((t) => !t); setErrors((e) => ({ ...e, terminosCuracion: undefined })); }}
              activeOpacity={0.75}
            >
              <View style={[styles.checkbox, terminosCuracion && styles.checkboxOn]}>
                {terminosCuracion && <MaterialIcons name="check" size={13} color={p.white} />}
              </View>
              <Text style={styles.checkText}>
                Acepto condiciones de curaduría (devolución con costo logístico si el artículo no es aceptado).{' '}
                <Text style={{ color: p.danger }}>*</Text>
              </Text>
            </TouchableOpacity>
            {errors.terminosCuracion ? <Text style={styles.fieldError}>{errors.terminosCuracion}</Text> : null}
          </View>

          {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

          {/* Botón enviar */}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={loading}
            activeOpacity={0.88}
            style={{ marginTop: 28 }}
          >
            <LinearGradient
              colors={loading ? ['#ABA9D7', '#ABA9D7'] : ['#0846ED', '#859AFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              <Text style={styles.submitText}>
                {loading ? 'Enviando...' : 'Enviar a revisión'}
              </Text>
              {!loading && <MaterialIcons name="send" size={20} color={p.white} style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.reviewNote}>REVISIÓN ESTIMADA: 24–48 HORAS HÁBILES</Text>

        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  blocked: { flex: 1, backgroundColor: p.background, padding: 24, alignItems: 'center', justifyContent: 'center' },
  blockedTitle: { color: p.text, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  blockedText: { color: p.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24 },

  container: { paddingHorizontal: 20, paddingTop: 16 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: p.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  sectionHint: { fontSize: 12, fontWeight: '700', color: p.primary },

  // Galería
  galeria: { flexDirection: 'row', gap: 12, paddingVertical: 8, paddingRight: 20 },
  galeriaAdd: {
    width: 112, height: 144, borderRadius: 12,
    backgroundColor: p.container,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(171,169,215,0.5)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  galeriaAddText: { fontSize: 10, fontWeight: '800', color: p.muted, textTransform: 'uppercase', letterSpacing: 1 },
  galeriaThumb: { width: 112, height: 144, borderRadius: 12, overflow: 'visible' },
  galeriaImg: { width: 112, height: 144, borderRadius: 12 },
  galeriaRemove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: p.danger,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  galeriaPlaceholder: {
    width: 112, height: 144, borderRadius: 12,
    backgroundColor: 'rgba(233,229,255,0.5)',
    borderWidth: 1, borderColor: 'rgba(171,169,215,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Campos
  fieldLabel: { fontSize: 11, fontWeight: '800', color: p.text, marginBottom: 6, letterSpacing: 0.3 },
  fieldInput: {
    backgroundColor: p.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: p.text,
    borderWidth: 0,
    shadowColor: p.text,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fieldInputFocused: {
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldInputError: { borderWidth: 1.5, borderColor: p.danger },
  fieldError: { color: p.danger, fontSize: 12, fontWeight: '600', marginTop: 5 },

  // Precio
  precioWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: p.text,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  precioInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: p.text },
  monedaToggle: {
    flexDirection: 'row',
    backgroundColor: p.container,
    margin: 6,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  monedaBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  monedaBtnActive: { backgroundColor: p.white },
  monedaText: { fontSize: 10, fontWeight: '900', color: p.muted },

  // Expandible
  expandCard: {
    backgroundColor: p.surfaceLow,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  expandHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  expandTitle: { fontSize: 14, fontWeight: '700', color: p.text },
  expandBody: { paddingHorizontal: 16, paddingBottom: 16 },

  // Checks
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: p.borderDash,
    backgroundColor: p.surface,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxOn: { backgroundColor: p.primary, borderColor: p.primary },
  checkText: { flex: 1, fontSize: 13, fontWeight: '500', color: p.muted, lineHeight: 20 },

  // Submit
  submitBtn: {
    height: 58, borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: p.primary, shadowOpacity: 0.25,
    shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  submitText: { color: p.white, fontSize: 16, fontWeight: '800' },
  reviewNote: {
    textAlign: 'center', color: p.borderDash,
    fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginTop: 14, marginBottom: 4,
  },
  serverError: { color: p.danger, textAlign: 'center', marginTop: 12, fontWeight: '600' },
});
