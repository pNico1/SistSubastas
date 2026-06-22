import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import {
  CategoryBreakdown,
  EmptyMetric,
  MetricHero,
  MetricItem,
  MetricRow,
  MetricScreen,
  MetricTag,
  Section,
  SummaryCard,
  ViewAllButton,
  metricPalette as p,
  money,
  moneyMap,
} from '../components/MetricScreenLayout';
import { formatDate } from '../utils/datetime';

function estadoVictoria(estado) {
  const normalized = String(estado || '').toLowerCase();
  if (normalized === 'pagado') return ['Pagada', 'success'];
  if (normalized === 'pendiente') return ['Pendiente', 'warning'];
  return [estado || 'Ganada', 'primary'];
}

export default function MetricasVictoriasScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, resumen] = await Promise.all([
        clienteApi.victorias(),
        clienteApi.victoriasStats(),
      ]);
      setItems(list || []);
      setStats(resumen || {});
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) return <Loading text="Cargando victorias..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const visible = expanded ? items : items.slice(0, 3);

  return (
    <MetricScreen
      navigation={navigation}
      route={route}
      title="Victorias"
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <MetricHero
        icon="emoji-events"
        eyebrow="Subastas ganadas"
        title="Victorias"
        value={stats?.total ?? items.length}
        tone="success"
      />

      <SummaryCard>
        <MetricRow label="Total pagado" value={moneyMap(stats?.importesPorMoneda)} />
      </SummaryCard>

      {items.length === 0 ? (
        <EmptyMetric
          icon="emoji-events"
          title="Todavia no tenes victorias"
          text="Las piezas ganadas van a aparecer aca con su puja final."
        />
      ) : (
        <Section title="Victorias recientes">
          {visible.map((item) => {
            const [label, tone] = estadoVictoria(item.estado);
            return (
              <MetricItem key={`${item.adquisicionId}-${item.productoId}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ color: p.text, fontSize: 15, fontWeight: '900', flex: 1 }}>
                    {item.producto || `Pieza #${item.productoId}`}
                  </Text>
                  <MetricTag label={label} tone={tone} />
                </View>
                <MetricRow label="Fecha" value={item.fecha ? formatDate(item.fecha) : 'Fecha no disponible'} />
                <MetricRow label="Subasta" value={`#${item.subastaId}`} />
                <MetricRow label="Puja final" value={money(item.importe, item.moneda || 'ARS')} />
                <MetricRow
                  label="Total pagado"
                  value={money(item.totalPagado ?? item.importe, item.moneda || 'ARS')}
                />
              </MetricItem>
            );
          })}
          <ViewAllButton
            expanded={expanded}
            total={items.length}
            onPress={() => setExpanded((value) => !value)}
          />
        </Section>
      )}

      <CategoryBreakdown values={stats?.porCategoria} />
    </MetricScreen>
  );
}
