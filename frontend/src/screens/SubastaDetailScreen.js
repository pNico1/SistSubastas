import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { subastasApi, clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import Button from '../components/Button';
import { colors, radius, spacing } from '../theme';

export default function SubastaDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [subasta, setSubasta] = useState(null);
  const [items, setItems] = useState([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, its, mis] = await Promise.all([
        subastasApi.getById(id),
        subastasApi.getItems(id),
        clienteApi.misSubastas(),
      ]);
      setSubasta(s);
      setItems(its);
      setJoined((mis || []).some((m) => m.subastaId === id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function onJoin() {
    setJoining(true);
    try {
      const res = await clienteApi.unirse(id);
      setJoined(true);
      Alert.alert('Te uniste', `Sos el postor N° ${res.numeroPostor}`);
    } catch (err) {
      Alert.alert('No se pudo unir', err.message || 'Error');
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <Loading text="Cargando subasta..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(it) => String(it.itemId)}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Subasta #{subasta.id}</Text>
          <Text style={styles.line}>Categoria: {subasta.categoria} · Moneda: {subasta.moneda}</Text>
          <Text style={styles.line}>📅 {subasta.fecha} · {subasta.hora}</Text>
          <Text style={styles.line}>📍 {subasta.ubicacion}</Text>
          <View style={{ marginTop: spacing.md }}>
            {joined ? (
              <View style={styles.joinedBox}>
                <Text style={styles.joinedText}>✓ Ya estas unido a esta subasta</Text>
              </View>
            ) : (
              <Button title="Unirme a la subasta" onPress={onJoin} loading={joining} variant="accent" />
            )}
          </View>
          <Text style={styles.sectionTitle}>Catalogo ({items.length})</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('ItemDetail', {
              subastaId: id,
              itemId: item.itemId,
              nombre: item.producto,
              joined,
            })
          }
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.producto || `Item ${item.itemId}`}</Text>
            <Text style={styles.itemBase}>Base: {subasta.moneda} {item.precioBase}</Text>
          </View>
          <Text style={[styles.itemEstado, item.subastado === 'si' && { color: colors.danger }]}>
            {item.subastado === 'si' ? 'Vendido' : 'Disponible'}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  header: { marginBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  line: { color: colors.textMuted, marginTop: spacing.xs },
  joinedBox: { backgroundColor: '#E7F6EC', padding: spacing.md, borderRadius: radius.md },
  joinedText: { color: colors.success, fontWeight: '700', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemBase: { color: colors.textMuted, marginTop: 2 },
  itemEstado: { color: colors.success, fontWeight: '700' },
});
