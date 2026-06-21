import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import {
  p, FadeUp, StatHeader, Bezel, VerTodasButton, money, softShadow,
} from './StatsKit';

function MetricTile({ icon, label, value, accent, index }) {
  return (
    <FadeUp delay={180 + index * 70} style={styles.tileWrap}>
      <Bezel tone={p.surfaceLow} style={{ flex: 1 }}>
        <View style={styles.tile}>
          <View style={[styles.tileIcon, { backgroundColor: accent + '1A' }]}>
            <MaterialIcons name={icon} size={18} color={accent} />
          </View>
          <Text style={styles.tileValue}>{value}</Text>
          <Text style={styles.tileLabel}>{label}</Text>
        </View>
      </Bezel>
    </FadeUp>
  );
}

export default function EstadisticasScreen({ navigation, route }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await clienteApi.asistenciasStats();
      setStats(data || {});
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading text="Calculando tus totales..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const monedas = Object.entries(stats.desglosePorMoneda || {});
  const ganadas = stats.subastasGanadas ?? 0;
  const ofertas = stats.totalAsistencias ?? 0;
  const winRate = ofertas > 0 ? Math.round((ganadas / ofertas) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <StatHeader navigation={navigation} route={route} eyebrow="Estadística" title="Total pagado" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Hero — total pagado */}
        <FadeUp delay={90}>
          <Bezel tone={p.container} style={styles.heroShell}>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>TOTAL PAGADO</Text>
              <Text style={styles.heroValue}>{money(stats.totalPagado)}</Text>
              <View style={styles.heroSub}>
                <MaterialIcons name="local-offer" size={14} color={p.muted} />
                <Text style={styles.heroSubText}>
                  Total ofertado {money(stats.totalOfertado)}
                </Text>
              </View>
              {stats.totalComisiones != null && (
                <View style={styles.commissionPill}>
                  <Text style={styles.commissionText}>
                    Comisiones {money(stats.totalComisiones)}
                  </Text>
                </View>
              )}
            </View>
          </Bezel>
        </FadeUp>

        {/* Bento de métricas */}
        <View style={styles.grid}>
          <MetricTile index={0} icon="gavel" label="Nº de ofertas" value={ofertas} accent={p.primary} />
          <MetricTile index={1} icon="emoji-events" label="Nº ofertas ganadas" value={ganadas} accent={p.tertiary} />
        </View>
        <View style={styles.grid}>
          <MetricTile index={2} icon="trending-down" label="Subastas perdidas" value={stats.subastasPerdidas ?? 0} accent={p.secondary} />
          <MetricTile index={3} icon="percent" label="Tasa de éxito" value={`${winRate}%`} accent={p.success} />
        </View>

        {/* Desglose por moneda */}
        {monedas.length > 0 && (
          <FadeUp delay={420}>
            <Text style={styles.sectionTitle}>Desglose por moneda</Text>
            <Bezel style={{ marginBottom: 22 }}>
              {monedas.map(([cur, val], i) => (
                <View
                  key={cur}
                  style={[styles.curRow, i < monedas.length - 1 && styles.curDivider]}
                >
                  <View style={styles.curBadge}>
                    <Text style={styles.curBadgeText}>{cur}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.curOfertado}>Ofertado {money(val.ofertado, cur)}</Text>
                    <Text style={styles.curPagado}>Pagado {money(val.pagado, cur)}</Text>
                  </View>
                </View>
              ))}
            </Bezel>
          </FadeUp>
        )}

        <View style={styles.ctaRow}>
          <VerTodasButton
            label="Ver victorias"
            onPress={() => navigation.navigate('Victorias')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48 },

  heroShell: { marginBottom: 14 },
  hero: { padding: 22 },
  heroLabel: { fontSize: 10, fontWeight: '800', color: p.primary, letterSpacing: 2 },
  heroValue: { fontSize: 44, fontWeight: '900', color: p.text, letterSpacing: -1.5, marginTop: 6 },
  heroSub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  heroSubText: { fontSize: 13, fontWeight: '700', color: p.muted },
  commissionPill: {
    alignSelf: 'flex-start', marginTop: 14,
    backgroundColor: p.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  commissionText: { fontSize: 12, fontWeight: '800', color: p.secondary },

  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tileWrap: { flex: 1 },
  tile: { padding: 16 },
  tileIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  tileValue: { fontSize: 26, fontWeight: '900', color: p.text, letterSpacing: -0.8 },
  tileLabel: { fontSize: 11, fontWeight: '700', color: p.muted, marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: p.text, marginTop: 12, marginBottom: 12 },

  curRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  curDivider: { borderBottomWidth: 1, borderBottomColor: p.border },
  curBadge: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: p.primaryFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  curBadgeText: { fontSize: 13, fontWeight: '900', color: p.primary, letterSpacing: 0.5 },
  curOfertado: { fontSize: 14, fontWeight: '800', color: p.text },
  curPagado: { fontSize: 12, fontWeight: '700', color: p.muted, marginTop: 2 },

  ctaRow: { marginTop: 4 },
});
