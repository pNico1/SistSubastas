import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { EmptyMetric, MetricHero, MetricItem, MetricRow, MetricScreen, MetricTag, Section, SummaryCard, ViewAllButton, metricPalette as p, money, moneyMap } from '../components/MetricScreenLayout';
import { formatDateTime } from '../utils/datetime';

export default function MetricasTotalPagadoScreen({ navigation, route }) {
  const [items, setItems] = useState([]); const [pujas, setPujas] = useState({}); const [victorias, setVictorias] = useState({}); const [expanded, setExpanded] = useState(false); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(null);
  const load = useCallback(async () => { setError(null); try { const [list, ps, vs] = await Promise.all([clienteApi.misPujas(), clienteApi.pujasStats(), clienteApi.victoriasStats()]); setItems(list || []); setPujas(ps || {}); setVictorias(vs || {}); } catch (e) { setError(e); } finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <Loading text="Cargando total pagado..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  const visible = expanded ? items : items.slice(0, 3); const first = Object.entries(victorias.importesPorMoneda || {})[0];
  return <MetricScreen navigation={navigation} route={route} title="Total pagado" refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
    <MetricHero icon="payments" eyebrow="Resumen de pujas" title="Total pagado" value={first ? money(first[1], first[0]) : money(0)} tone="tertiary" />
    <SummaryCard><MetricRow label="Total ofertado" value={moneyMap(pujas.porMoneda)} /><MetricRow label="Total pagado" value={moneyMap(victorias.importesPorMoneda)} /><MetricRow label="Número de ofertas" value={pujas.total || 0} /><MetricRow label="Ofertas ganadoras" value={pujas.ganadoras || 0} /></SummaryCard>
    {!items.length ? <EmptyMetric icon="gavel" title="Todavía no hiciste ofertas" text="Tus pujas e importes aparecerán en esta pantalla." /> : <Section title="Últimas ofertas">{visible.map((item) => <MetricItem key={item.id}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><Text style={{ flex: 1, color: p.text, fontSize: 15, fontWeight: '900' }}>{item.producto || `Pieza #${item.item}`}</Text>{item.ganador === 'si' ? <MetricTag label="Ganadora" tone="success" /> : null}</View><MetricRow label="Fecha" value={item.fechaHora ? formatDateTime(item.fechaHora) : 'No disponible'} /><MetricRow label="Subasta" value={`#${item.subasta}`} /><MetricRow label="Oferta" value={money(item.importe)} /></MetricItem>)}<ViewAllButton expanded={expanded} total={items.length} onPress={() => setExpanded(!expanded)} /></Section>}
  </MetricScreen>;
}
