import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { CategoryBreakdown, EmptyMetric, MetricHero, MetricItem, MetricRow, MetricScreen, MetricTag, Section, SummaryCard, ViewAllButton, metricPalette as p, money, moneyMap } from '../components/MetricScreenLayout';
import { formatDate } from '../utils/datetime';

export default function MetricasVictoriasScreen({ navigation, route }) {
  const [items, setItems] = useState([]); const [stats, setStats] = useState({}); const [expanded, setExpanded] = useState(false); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(null);
  const load = useCallback(async () => { setError(null); try { const [list, resumen] = await Promise.all([clienteApi.victorias(), clienteApi.victoriasStats()]); setItems(list || []); setStats(resumen || {}); } catch (e) { setError(e); } finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <Loading text="Cargando victorias..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  const visible = expanded ? items : items.slice(0, 3);
  return <MetricScreen navigation={navigation} route={route} title="Victorias" refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
    <MetricHero icon="emoji-events" eyebrow="Subastas ganadas" title="Victorias" value={stats.total ?? items.length} tone="success" />
    <SummaryCard><MetricRow label="Total pagado" value={moneyMap(stats.importesPorMoneda)} /></SummaryCard>
    {!items.length ? <EmptyMetric icon="emoji-events" title="Todavía no tenés victorias" text="Las piezas ganadas aparecerán acá con su puja final." /> : <Section title="Victorias recientes">{visible.map((item) => <MetricItem key={`${item.adquisicionId}-${item.productoId}`}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><Text style={{ flex: 1, color: p.text, fontSize: 15, fontWeight: '900' }}>{item.producto || `Pieza #${item.productoId}`}</Text><MetricTag label={item.estado === 'pagado' ? 'Pagada' : item.estado || 'Ganada'} tone={item.estado === 'pagado' ? 'success' : 'warning'} /></View><MetricRow label="Fecha" value={item.fecha ? formatDate(item.fecha) : 'No disponible'} /><MetricRow label="Subasta" value={`#${item.subastaId}`} /><MetricRow label="Puja final" value={money(item.importe, item.moneda || 'ARS')} /><MetricRow label="Total pagado" value={money(item.totalPagado ?? item.importe, item.moneda || 'ARS')} /></MetricItem>)}<ViewAllButton expanded={expanded} total={items.length} onPress={() => setExpanded(!expanded)} /></Section>}
    <CategoryBreakdown values={stats.porCategoria} />
  </MetricScreen>;
}
