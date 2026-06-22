import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import ScreenHeader from '../components/ScreenHeader';

const p = {
  bg: '#F9F5FF',
  surface: '#FFF',
  primary: '#0846ED',
  text: '#2B2A51',
  muted: '#585781',
  border: '#D8D4EC',
  success: '#16803A',
  warning: '#B45309',
};

const result = {
  ganada: ['Ganada', p.success],
  sin_victoria: ['Sin victoria', p.muted],
  en_curso: ['En curso', p.warning],
};

export default function HistorialSubastasScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await clienteApi.historialSubastas());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <Loading text="Cargando historial..." />;
  if (error) {
    return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader navigation={navigation} route={route} title="Historial de subastas" />
      <FlatList
        data={items}
        keyExtractor={(x) => String(x.subastaId)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Todavía no participaste en subastas.</Text>
        }
        renderItem={({ item }) => {
          const cfg = result[item.resultado] || [item.resultado, p.muted];
          return (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.cardTitle}>Subasta #{item.subastaId}</Text>
                <Text style={[styles.result, { color: cfg[1] }]}>{cfg[0]}</Text>
              </View>
              <Text style={styles.meta}>{item.fecha || 'Fecha no disponible'} · {item.hora || ''}</Text>
              <Text style={styles.meta}>
                {(item.categoria || '').toUpperCase()} · {item.moneda || ''} · Postor #{item.numeroPostor}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.bg },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: p.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: p.border,
    padding: 16,
    marginBottom: 11,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '900', color: p.text },
  result: { fontWeight: '800', fontSize: 12 },
  meta: { color: p.muted, fontSize: 12, marginTop: 7 },
  empty: { color: p.muted, textAlign: 'center', marginTop: 80 },
});
