import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { productosApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

const MAX_FOTOS = 8;

// Circuito "ofrecer un bien": el dueño carga un producto con fotos para subastar.
export default function OfrecerBienScreen({ navigation }) {
  const { user } = useAuth();
  const pendingVerification = user?.estado === 'pending_verification';
  const [form, setForm] = useState({
    descripcionCatalogo: '',
    descripcionCompleta: '',
    nombreArtista: '',
    fechaObra: '',
    historia: '',
  });
  const [fotos, setFotos] = useState([]); // [{ uri, base64 }]
  const [terminos, setTerminos] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function agregarFotos() {
    setServerError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para adjuntar imagenes del producto.');
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

    const nuevas = (result.assets || [])
      .filter((a) => a.base64)
      .map((a) => ({ uri: a.uri, base64: a.base64 }));

    setFotos((prev) => {
      const combinadas = [...prev, ...nuevas].slice(0, MAX_FOTOS);
      if (prev.length + nuevas.length > MAX_FOTOS) {
        Alert.alert('Maximo de fotos', `Podes subir hasta ${MAX_FOTOS} fotos.`);
      }
      return combinadas;
    });
    setErrors((e) => ({ ...e, fotos: undefined }));
  }

  function quitarFoto(index) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const e = {};
    if (!form.descripcionCatalogo.trim()) e.descripcionCatalogo = 'Pone un titulo / descripcion de catalogo';
    if (fotos.length === 0) e.fotos = 'Subi al menos una foto';
    if (!terminos) e.terminos = 'Tenes que aceptar los terminos';
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
        terminosAceptados: terminos,
        fotos: fotos.map((f) => f.base64),
      });
      Alert.alert(
        'Producto enviado',
        `${res.mensaje}. Quedo en estado "${res.estado}" con ${res.cantidadFotos} foto(s).`,
        [{ text: 'Listo', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      // Errores conocidos del backend -> a campo puntual cuando aplica.
      if (err.code === 'NO_PHOTOS') {
        setErrors((e) => ({ ...e, fotos: err.message }));
      } else if (err.code === 'TERMS_NOT_ACCEPTED') {
        setErrors((e) => ({ ...e, terminos: err.message }));
      } else if (err.code === 'VALIDATION_ERROR' && err.fields) {
        setErrors((e) => ({ ...e, ...err.fields }));
      } else {
        setServerError(err.message || 'No se pudo enviar el producto');
      }
    } finally {
      setLoading(false);
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedTitle}>Cuenta en verificación</Text>
        <Text style={styles.blockedText}>
          Tu cuenta todavía está pendiente de aprobación. Vas a poder enviar un bien a revisión cuando un administrador la verifique.
        </Text>
        <Button title="Volver al inicio" onPress={() => navigation.navigate('Bidster')} variant="accent" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ofrecer un bien</Text>
        <Text style={styles.subtitle}>Carga tu producto y sus fotos. Un empleado lo revisara antes de subastarse.</Text>

        <View style={styles.card}>
          <TextField
            label="Titulo / descripcion de catalogo"
            value={form.descripcionCatalogo}
            onChangeText={(v) => set('descripcionCatalogo', v)}
            placeholder="Ej: Reloj de bolsillo antiguo"
            error={errors.descripcionCatalogo}
          />
          <TextField
            label="Descripcion completa (opcional)"
            value={form.descripcionCompleta}
            onChangeText={(v) => set('descripcionCompleta', v)}
            placeholder="Detalle, estado de conservacion, etc."
            multiline
            numberOfLines={3}
            error={errors.descripcionCompleta}
          />
          <TextField
            label="Artista / autor (opcional)"
            value={form.nombreArtista}
            onChangeText={(v) => set('nombreArtista', v)}
            placeholder="Ej: Patek Philippe"
          />
          <TextField
            label="Fecha de la obra (opcional)"
            value={form.fechaObra}
            onChangeText={(v) => set('fechaObra', v)}
            placeholder="Ej: 1920"
          />
          <TextField
            label="Historia / procedencia (opcional)"
            value={form.historia}
            onChangeText={(v) => set('historia', v)}
            placeholder="De donde viene la pieza"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Fotos ({fotos.length}/{MAX_FOTOS})</Text>
          <View style={styles.thumbs}>
            {fotos.map((f, i) => (
              <View key={`${f.uri}-${i}`} style={styles.thumbWrap}>
                <Image source={{ uri: f.uri }} style={styles.thumb} />
                <TouchableOpacity style={styles.thumbRemove} onPress={() => quitarFoto(i)}>
                  <Text style={styles.thumbRemoveText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {fotos.length < MAX_FOTOS ? (
              <TouchableOpacity style={styles.addThumb} onPress={agregarFotos}>
                <Text style={styles.addThumbPlus}>+</Text>
                <Text style={styles.addThumbText}>Agregar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {errors.fotos ? <Text style={styles.error}>{errors.fotos}</Text> : null}
        </View>

        <TouchableOpacity
          style={styles.terminos}
          onPress={() => { setTerminos((t) => !t); setErrors((e) => ({ ...e, terminos: undefined })); }}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, terminos && styles.checkboxOn]}>
            {terminos ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </View>
          <Text style={styles.terminosText}>
            Acepto los terminos y condiciones para ofrecer este bien en subasta.
          </Text>
        </TouchableOpacity>
        {errors.terminos ? <Text style={styles.error}>{errors.terminos}</Text> : null}

        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}

        <Button title="Enviar a revision" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  blocked: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  blockedTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  blockedText: { color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: spacing.lg },
  container: { padding: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 16, marginBottom: spacing.md },
  sectionTitle: { fontWeight: '700', color: colors.text, marginBottom: spacing.sm, fontSize: 16 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumbWrap: { position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.border },
  thumbRemove: {
    position: 'absolute', top: -6, right: -6, backgroundColor: colors.danger,
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
  },
  thumbRemoveText: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 17 },
  addThumb: {
    width: 84, height: 84, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  addThumbPlus: { color: colors.primary, fontSize: 24, fontWeight: '700', lineHeight: 26 },
  addThumbText: { color: colors.primary, fontSize: 12 },
  terminos: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  checkboxOn: { backgroundColor: colors.primary },
  checkboxTick: { color: '#fff', fontWeight: '800', fontSize: 14 },
  terminosText: { flex: 1, color: colors.text },
  error: { color: colors.danger, marginTop: spacing.xs, fontSize: 13, marginBottom: spacing.sm },
  serverError: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
