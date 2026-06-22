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
} from '../components/MetricScreenLayout';
import { formatDate, formatTime, parseServerDateAndTime } from '../utils/datetime';

function fechaParticipacion(item) {
  const d = parseServerDateAndTime(item.fecha, item.hora);
  if (!d) return item.fecha || 'Fecha no disponible';
  return `${formatDate(d)} · ${formatTime(d)}`;
}

function resultadoLabel(resultado) {
  if (resultado === 'ganada') return ['Ganada', 'success'];
  if (resultado === 'sin_victoria') return ['Sin victoria', 'tertiary'];
  return ['En curso', 'warning'];
}

export default function MetricasAsistenciasScreen({ navigation, route }) {
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
        clienteApi.asistencias(),
        clienteApi.asistenciasStats(),
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

  if (loading) return <Loading text="Cargando asistencias..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const visible = expanded ? items : items.slice(0, 3);

  return (
    <MetricScreen
      navigation={navigation}
      route={route}
      title="Asistencias"
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <MetricHero
        icon="groups"
        eyebrow="Ultimas participaciones"
        title="Asistencias"
        value={stats?.total ?? items.length}
      />

      <SummaryCard>
        <MetricRow label="Subastas abiertas" value={stats?.abiertas || 0} />
        <MetricRow label="Subastas cerradas" value={stats?.cerradas || 0} />
      </SummaryCard>

      {items.length === 0 ? (
        <EmptyMetric
          icon="groups"
          title="Todavia no registras asistencias"
          text="Cuando te unas a una subasta, va a aparecer en esta pantalla."
        />
      ) : (
        <Section title="Ultimas participaciones">
          {visible.map((item) => {
            const [label, tone] = resultadoLabel(item.resultado);
            return (
              <MetricItem key={`${item.subastaId}-${item.numeroPostor}`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ color: p.text, fontSize: 15, fontWeight: '900' }}>
                    Subasta #{item.subastaId}
                  </Text>
                  <MetricTag label={label} tone={tone} />
                </View>
                <MetricRow label="Fecha" value={fechaParticipacion(item)} />
                <MetricRow label="Postor" value={`#${item.numeroPostor || '-'}`} />
                <MetricRow label="Categoria" value={item.categoria || 'General'} />
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
