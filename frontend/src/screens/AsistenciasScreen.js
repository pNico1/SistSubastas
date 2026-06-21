import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import {
  p, FadeUp, StatHeader, Bezel, VerTodasButton, formatFecha,
} from './StatsKit';

const PREVIEW = 5;

const ESTADO = {
  abierta: { label: 'Abierta', color: p.success, bg: p.successFaint },
  cerrada: { label: 'Cerrada', color: p.muted, bg: p.surfaceLow },
};

function AsistenciaRow({ row, index, last }) {
  const subasta = row.subasta || {};
  const est = ESTADO[subasta.estado] || { label: subasta.estado || '—', color: p.muted, bg: p.surfaceLow };
  return (
    <FadeUp delay={140 + index * 60}>
      <View style={[styles.row, !last && styles.rowDivider]}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateText}>{formatFecha(subasta.fecha)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subastaName}>Subasta #{subasta.id ?? '—'}</Text>
          {row.numeroPostor != null && (
            <Text style={styles.postor}>Postor n.º {row.numeroPostor}</Text>
          )}
        </View>
        <View style={[styles.estado, { backgroundColor: est.bg }]}>
          <Text style={[styles.estadoText, { color: est.color }]}>{est.label}</Text>
        </View>
      </View>
    </FadeUp>
  );
}

export default function AsistenciasScreen({ navigation, route }) {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await clienteApi.asistencias();
      const list = [...(data || [])].sort(
        (a, b) => new Date(b.subasta?.fecha) - new Date(a.subasta?.fecha)
      );
      setRows(list);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading text="Cargando tus participaciones..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const visible = expanded ? rows : rows.slice(0, PREVIEW);
  const hayMas = rows.length > PREVIEW;

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <StatHeader
        navigation={navigation}
        route={route}
        eyebrow="Estadística"
        title="Últimas participaciones"
        accent={p.tertiary}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        <FadeUp delay={90}>
          <View style={styles.tally}>
            <Text style={styles.tallyValue}>{rows.length}</Text>
            <Text style={styles.tallyLabel}>subastas en las que participaste</Text>
          </View>
        </FadeUp>

        {rows.length === 0 ? (
          <FadeUp delay={120}>
            <View style={styles.empty}>
              <MaterialIcons name="event-busy" size={40} color={p.border} />
              <Text style={styles.emptyText}>Todavía no participaste en subastas.</Text>
            </View>
          </FadeUp>
        ) : (
          <>
            <Bezel style={{ marginBottom: 16 }}>
              {visible.map((row, i) => (
                <AsistenciaRow
                  key={row.asistenciaId ?? `${row.subasta?.id}-${i}`}
                  row={row}
                  index={i}
                  last={i === visible.length - 1}
                />
              ))}
            </Bezel>

            {hayMas && (
              <View style={styles.ctaRow}>
                <VerTodasButton
                  label={expanded ? 'Ver menos' : 'Ver todas'}
                  count={expanded ? undefined : rows.length}
                  onPress={() => setExpanded((v) => !v)}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },

  tally: { marginBottom: 22 },
  tallyValue: { fontSize: 30, fontWeight: '900', color: p.tertiary, letterSpacing: -1 },
  tallyLabel: { fontSize: 13, fontWeight: '600', color: p.muted, marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: p.border },
  dateBlock: {
    backgroundColor: p.surfaceLow, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 8, minWidth: 86, alignItems: 'center',
  },
  dateText: { fontSize: 12, fontWeight: '800', color: p.text },
  subastaName: { fontSize: 15, fontWeight: '800', color: p.text },
  postor: { fontSize: 12, fontWeight: '600', color: p.muted, marginTop: 2 },
  estado: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  estadoText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  ctaRow: { marginTop: 4 },

  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: p.muted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
