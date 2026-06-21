import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi, paisesApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const p = { background: '#F9F5FF', surface: '#FFF', surfaceLow: '#F2EFFF', primary: '#0846ED', text: '#2B2A51', muted: '#585781', border: '#D8D4EC', danger: '#B41340' };

export default function EditarPerfilScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ nombre: '', apellido: '', direccion: '', paisId: null, pais: '' });
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await clienteApi.perfil();
      setForm({ nombre: data.nombre || '', apellido: data.apellido || '', direccion: data.direccion || '', paisId: data.pais?.id || null, pais: data.pais?.nombre || '' });
    } catch (e) { setError(e); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function buscarPais(text) {
    setForm((old) => ({ ...old, pais: text, paisId: null }));
    if (text.trim().length < 2) return setPaises([]);
    try { setPaises((await paisesApi.listar(text)).slice(0, 6)); } catch { setPaises([]); }
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.direccion.trim() || !form.paisId) {
      Alert.alert('Faltan datos', 'Completá nombre, apellido, dirección y seleccioná un país.'); return;
    }
    setSaving(true);
    try {
      await clienteApi.actualizarPerfil({ nombre: form.nombre, apellido: form.apellido, direccion: form.direccion, paisId: form.paisId });
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.', [{ text: 'Listo', onPress: () => goBackOrReturnTo(navigation, route) }]);
    } catch (e) { Alert.alert('No se pudo guardar', e.message || 'Error'); } finally { setSaving(false); }
  }

  if (loading) return <Loading text="Cargando perfil..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); setError(null); load(); }} />;
  return <View style={styles.screen}>
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}><TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.back}><MaterialIcons name="arrow-back" size={22} color={p.text} /></TouchableOpacity><Text style={styles.headerTitle}>Editar perfil</Text><View style={{ width: 36 }} /></View>
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Field label="Nombre" value={form.nombre} onChangeText={(v) => setForm({ ...form, nombre: v })} />
      <Field label="Apellido" value={form.apellido} onChangeText={(v) => setForm({ ...form, apellido: v })} />
      <Field label="Dirección legal" value={form.direccion} onChangeText={(v) => setForm({ ...form, direccion: v })} />
      <Field label="País" value={form.pais} onChangeText={buscarPais} />
      {paises.map((pais) => <TouchableOpacity key={pais.id} style={styles.country} onPress={() => { setForm({ ...form, paisId: pais.id, pais: pais.nombre }); setPaises([]); }}><Text style={styles.countryText}>{pais.nombre}</Text></TouchableOpacity>)}
      <TouchableOpacity style={[styles.save, saving && { opacity: 0.6 }]} disabled={saving} onPress={guardar}><Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text></TouchableOpacity>
    </ScrollView>
  </View>;
}

function Field({ label, ...props }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} placeholderTextColor={p.muted} {...props} /></View>; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: p.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.border }, back: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surfaceLow, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 16, fontWeight: '800', color: p.text }, body: { padding: 20 }, field: { marginBottom: 16 }, label: { fontSize: 12, fontWeight: '800', color: p.text, marginBottom: 7 }, input: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: p.text, fontSize: 15 }, country: { backgroundColor: p.surface, padding: 13, borderBottomWidth: 1, borderBottomColor: p.border }, countryText: { color: p.text, fontWeight: '600' }, save: { height: 52, borderRadius: 14, backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, saveText: { color: '#FFF', fontWeight: '800', fontSize: 15 } });
