import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const p = { bg: '#F9F5FF', surface: '#FFF', low: '#F2EFFF', primary: '#0846ED', text: '#2B2A51', muted: '#585781', border: '#D8D4EC', success: '#16A34A' };
const money = (n) => Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 });

export default function MetricasScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState(null);
  const load = useCallback(async () => { setError(null); try { const [a, v, pu] = await Promise.all([clienteApi.asistenciasStats(), clienteApi.victoriasStats(), clienteApi.pujasStats()]); setData({ a, v, pu }); } catch (e) { setError(e); } finally { setLoading(false); setRefreshing(false); } }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <Loading text="Calculando métricas..." />; if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  return <View style={styles.screen}><View style={[styles.header, { paddingTop: insets.top + 10 }]}><TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.back}><MaterialIcons name="arrow-back" size={22} color={p.text} /></TouchableOpacity><Text style={styles.headerTitle}>Mis métricas</Text><View style={{ width: 36 }} /></View>
    <ScrollView contentContainerStyle={styles.body} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.cards}><Card icon="groups" label="Asistencias" value={data.a.total} /><Card icon="emoji-events" label="Victorias" value={data.v.total} color={p.success} /><Card icon="gavel" label="Pujas" value={data.pu.total} /></View>
      <Section title="Pujas"><Row label="Pujas ganadoras" value={data.pu.ganadoras} /><Row label="Oferta promedio" value={`$ ${money(data.pu.importePromedio)}`} /><Row label="Oferta máxima" value={`$ ${money(data.pu.ofertaMaxima)}`} /><Breakdown title="Por categoría" values={data.pu.porCategoria} /></Section>
      <Section title="Participaciones"><Row label="Subastas cerradas" value={data.a.cerradas} /><Row label="Subastas abiertas" value={data.a.abiertas} /><Breakdown title="Por categoría" values={data.a.porCategoria} /></Section>
      <Section title="Importes de victorias"><Breakdown values={data.v.importesPorMoneda} moneyValues /></Section>
    </ScrollView></View>;
}
function Card({ icon, label, value, color = p.primary }) { return <View style={styles.card}><MaterialIcons name={icon} size={22} color={color} /><Text style={styles.cardValue}>{value}</Text><Text style={styles.cardLabel}>{label}</Text></View>; }
function Section({ title, children }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function Row({ label, value }) { return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }
function Breakdown({ title, values = {}, moneyValues }) { const entries = Object.entries(values || {}); if (!entries.length) return null; return <View style={styles.breakdown}>{title ? <Text style={styles.breakTitle}>{title}</Text> : null}{entries.map(([k, v]) => <Row key={k} label={k.toUpperCase()} value={moneyValues ? `$ ${money(v)}` : v} />)}</View>; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: p.bg }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.border }, back: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.low, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 16, fontWeight: '800', color: p.text }, body: { padding: 18, paddingBottom: 36 }, cards: { flexDirection: 'row', gap: 10, marginBottom: 16 }, card: { flex: 1, backgroundColor: p.surface, borderRadius: 15, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: p.border }, cardValue: { fontSize: 24, fontWeight: '900', color: p.text, marginTop: 5 }, cardLabel: { fontSize: 10, fontWeight: '700', color: p.muted, textTransform: 'uppercase' }, section: { backgroundColor: p.surface, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: p.border, marginBottom: 12 }, sectionTitle: { fontSize: 16, fontWeight: '900', color: p.text, marginBottom: 10 }, row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 }, rowLabel: { color: p.muted, fontSize: 13, textTransform: 'capitalize' }, rowValue: { color: p.text, fontSize: 14, fontWeight: '800' }, breakdown: { borderTopWidth: 1, borderTopColor: p.border, marginTop: 8, paddingTop: 8 }, breakTitle: { color: p.primary, fontWeight: '800', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 } });
