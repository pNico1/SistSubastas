import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';
import ScreenHeader from '../components/ScreenHeader';

const p = {
  background:   '#F9F5FF',
  surface:      '#FFFFFF',
  surfaceLow:   '#F2EFFF',
  primary:      '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.10)',
  text:         '#2B2A51',
  muted:        '#585781',
  border:       'rgba(171,169,215,0.35)',
  success:      '#16A34A',
  warning:      '#D97706',
  white:        '#FFFFFF',
};

// Pasos posibles del seguimiento. Ajustar claves cuando el backend defina los estados reales.
const PASOS = [
  { key: 'preparando', label: 'Preparando envío', icon: 'inventory' },
  { key: 'en_camino', label: 'En camino', icon: 'local-shipping' },
  { key: 'entregado', label: 'Entregado', icon: 'check-circle' },
];

export default function DevolucionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NOTA: endpoint pendiente -> GET /api/clientes/me/productos/{id}/devolucion
  // Se asume: { estadoEnvio, transportista, codigoSeguimiento, costoEnvio, moneda, direccion }
  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await productosApi.getDevolucion(id);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <Loading text="Cargando devolución..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  if (!data) return null;

  const pasoActualIndex = PASOS.findIndex((p2) => p2.key === data.estadoEnvio);

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <ScreenHeader navigation={navigation} route={route} title="Devolución" />

      <ScrollView contentContainerStyle={styles.body}>
        {/* Timeline de seguimiento */}
        <View style={styles.timeline}>
          {PASOS.map((paso, i) => {
            const done = pasoActualIndex >= 0 && i <= pasoActualIndex;
            return (
              <View key={paso.key} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                    <MaterialIcons
                      name={paso.icon}
                      size={16}
                      color={done ? p.white : p.muted}
                    />
                  </View>
                  {i < PASOS.length - 1 && (
                    <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                  )}
                </View>
                <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                  {paso.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Detalle del envío */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalle del envío</Text>
          {data.transportista && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transportista</Text>
              <Text style={styles.infoValue}>{data.transportista}</Text>
            </View>
          )}
          {data.codigoSeguimiento && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Código de seguimiento</Text>
              <Text style={styles.infoValue}>{data.codigoSeguimiento}</Text>
            </View>
          )}
          {data.direccion && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección de entrega</Text>
              <Text style={styles.infoValue}>{data.direccion}</Text>
            </View>
          )}
        </View>

        {/* Costo de devolución */}
        {data.costoEnvio != null && (
          <View style={styles.costoCard}>
            <MaterialIcons name="payments" size={18} color={p.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.costoTitle}>Costo de devolución (a tu cargo)</Text>
              <Text style={styles.costoValue}>
                {data.moneda || '$'} {data.costoEnvio}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: p.surface,
    borderBottomWidth: 1, borderBottomColor: p.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: p.surfaceLow,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: p.text },

  body: { padding: 20 },

  timeline: { marginBottom: 24, paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', marginRight: 14 },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: p.surfaceLow,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: p.success },
  timelineLine: { width: 2, height: 32, backgroundColor: p.border },
  timelineLineDone: { backgroundColor: p.success },
  timelineLabel: { fontSize: 14, fontWeight: '600', color: p.muted, paddingTop: 6 },
  timelineLabelDone: { color: p.text, fontWeight: '800' },

  card: {
    backgroundColor: p.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: p.border, marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: p.text, marginBottom: 10 },
  infoRow: { marginBottom: 10 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: p.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: p.text, marginTop: 2 },

  costoCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14,
  },
  costoTitle: { fontSize: 12, fontWeight: '700', color: p.warning, marginBottom: 2 },
  costoValue: { fontSize: 18, fontWeight: '900', color: p.text },
});
