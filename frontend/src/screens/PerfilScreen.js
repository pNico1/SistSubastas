import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { colors, radius, spacing } from '../theme';

// "Mi cuenta": perfil del cliente, sus medios de pago (alta/baja) y su historial de pujas.
export default function PerfilScreen() {
  const [perfil, setPerfil] = useState(null);
  const [metodos, setMetodos] = useState([]);
  const [pujas, setPujas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // alta de tarjeta
  const [showForm, setShowForm] = useState(false);
  const [card, setCard] = useState({ marca: '', numero: '', titular: '', moneda: 'ARS' });
  const [cardErrors, setCardErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, m, pj] = await Promise.all([
        clienteApi.perfil(),
        clienteApi.metodosPago(),
        clienteApi.misPujas(),
      ]);
      setPerfil(p);
      setMetodos(m || []);
      setPujas(pj || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function validateCard() {
    const e = {};
    if (!card.marca.trim()) e.marca = 'Ingresa la marca (Visa, Mastercard...)';
    if (!/^\d{12,19}$/.test(card.numero.replace(/\s/g, ''))) e.numero = 'Numero de tarjeta invalido';
    if (!card.titular.trim()) e.titular = 'Ingresa el titular';
    setCardErrors(e);
    return Object.keys(e).length === 0;
  }

  async function agregarTarjeta() {
    if (!validateCard()) return;
    setSaving(true);
    try {
      await clienteApi.crearMetodoPago({
        tipo: 'tarjeta',
        marca: card.marca.trim(),
        numero: card.numero.replace(/\s/g, ''),
        titular: card.titular.trim(),
        moneda: card.moneda,
        esInternacional: false,
      });
      setCard({ marca: '', numero: '', titular: '', moneda: 'ARS' });
      setShowForm(false);
      Alert.alert('Tarjeta agregada', 'Queda pendiente de verificacion por la empresa.');
      await load();
    } catch (err) {
      Alert.alert('No se pudo agregar', err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  function eliminar(id) {
    Alert.alert('Eliminar medio de pago', '¿Seguro que queres eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await clienteApi.eliminarMetodoPago(id);
            await load();
          } catch (err) {
            Alert.alert('No se pudo eliminar', err.message || 'Error');
          }
        },
      },
    ]);
  }

  if (loading) return <Loading text="Cargando tu cuenta..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {/* Perfil */}
      <View style={styles.card}>
        <Text style={styles.nombre}>{perfil.nombre} {perfil.apellido}</Text>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{perfil.categoria}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: perfil.admitido === 'si' ? colors.success : colors.warning }]}>
            <Text style={styles.badgeText}>{perfil.admitido === 'si' ? 'admitido' : 'no admitido'}</Text>
          </View>
        </View>
        {perfil.pais ? <Text style={styles.line}>Pais: {perfil.pais.nombre}</Text> : null}
      </View>

      {/* Medios de pago */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Medios de pago</Text>
        <TouchableOpacity onPress={() => setShowForm((s) => !s)}>
          <Text style={styles.action}>{showForm ? 'Cerrar' : '+ Agregar tarjeta'}</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <View style={styles.card}>
          <TextField label="Marca" value={card.marca} placeholder="Visa"
            onChangeText={(v) => setCard((c) => ({ ...c, marca: v }))} error={cardErrors.marca} />
          <TextField label="Numero de tarjeta" value={card.numero} placeholder="4111111111111111"
            keyboardType="number-pad"
            onChangeText={(v) => setCard((c) => ({ ...c, numero: v }))} error={cardErrors.numero} />
          <TextField label="Titular" value={card.titular} placeholder="Juan Perez"
            onChangeText={(v) => setCard((c) => ({ ...c, titular: v }))} error={cardErrors.titular} />
          <View style={styles.monedaRow}>
            {['ARS', 'USD'].map((m) => (
              <TouchableOpacity key={m}
                style={[styles.monedaChip, card.moneda === m && styles.monedaChipActive]}
                onPress={() => setCard((c) => ({ ...c, moneda: m }))}>
                <Text style={[styles.monedaText, card.moneda === m && styles.monedaTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button title="Guardar tarjeta" onPress={agregarTarjeta} loading={saving} variant="accent" />
        </View>
      ) : null}

      {metodos.length === 0 ? (
        <Text style={styles.empty}>No tenes medios de pago cargados.</Text>
      ) : (
        metodos.map((m) => (
          <View key={m.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>
                {m.tipo === 'tarjeta' ? `${m.marca || 'Tarjeta'} ****${m.ultimos4 || ''}` : m.banco || m.tipo}
              </Text>
              <Text style={styles.itemSub}>{m.titular} · {m.moneda || '-'}</Text>
            </View>
            <View style={[styles.estadoChip, m.estado === 'verified' ? styles.ok : styles.pending]}>
              <Text style={styles.estadoText}>{m.estado === 'verified' ? 'verificada' : 'pendiente'}</Text>
            </View>
            <TouchableOpacity onPress={() => eliminar(m.id)}>
              <Text style={styles.delete}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Mis pujas */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Mis pujas ({pujas.length})</Text>
      {pujas.length === 0 ? (
        <Text style={styles.empty}>Todavia no hiciste ninguna puja.</Text>
      ) : (
        pujas.map((p) => (
          <View key={p.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{p.producto || `Item ${p.item}`}</Text>
              <Text style={styles.itemSub}>Subasta {p.subasta}</Text>
            </View>
            <Text style={styles.importe}>${p.importe}</Text>
            {p.ganador === 'si' ? <Text style={styles.gano}>🏆</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  nombre: { fontSize: 20, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  line: { color: colors.textMuted, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  action: { color: colors.primary, fontWeight: '700' },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  itemTitle: { fontWeight: '600', color: colors.text },
  itemSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  estadoChip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  ok: { backgroundColor: '#E7F6EC' },
  pending: { backgroundColor: '#FEF3C7' },
  estadoText: { fontSize: 12, fontWeight: '700', color: colors.text },
  delete: { color: colors.danger, fontSize: 18, fontWeight: '700', paddingHorizontal: spacing.xs },
  importe: { fontWeight: '800', color: colors.primary },
  gano: { fontSize: 18 },
  monedaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  monedaChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  monedaChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monedaText: { color: colors.text, fontWeight: '600' },
  monedaTextActive: { color: '#fff' },
});
