import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import {
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
import { formatDateTime } from '../utils/datetime';

function compactPaid(values = {}) {
  const entries = Object.entries(values || {});
  if (!entries.length) return money(0);
  const [currency, value] = entries[0];
  return money(value, currency);
}

export default function MetricasTotalPagadoScreen({ navigation, route }) {
  const [pujas, setPujas] = useState([]);
  const [pujasStats, setPujasStats] = useState(null);
  const [victoriasStats, setVictoriasStats] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [misPujas, resumenPujas, resumenVictorias] = await Promise.all([
        clienteApi.misPujas(),
        clienteApi.pujasStats(),
        clienteApi.victoriasStats(),
      ]);
      setPujas(misPujas || []);
      setPujasStats(resumenPujas || {});
      setVictoriasStats(resumenVictorias || {});
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

  if (loading) return <Loading text="Cargando total pagado..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const visible = expanded ? pujas : pujas.slice(0, 3);

  return (
    <MetricScreen
      navigation={navigation}
      route={route}
      title="Total pagado"
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <MetricHero
        icon="payments"
        eyebrow="Resumen de pujas"
        title="Total pagado"
        value={compactPaid(victoriasStats?.importesPorMoneda)}
        tone="tertiary"
      />

      <SummaryCard>
        <MetricRow label="Total ofertado" value={moneyMap(pujasStats?.porMoneda)} />
        <MetricRow label="Total pagado" value={moneyMap(victoriasStats?.importesPorMoneda)} />
        <MetricRow label="Nro. de ofertas" value={pujasStats?.total || 0} />
        <MetricRow label="Nro. ofertas ganadoras" value={pujasStats?.ganadoras || 0} />
      </SummaryCard>

      {pujas.length === 0 ? (
        <EmptyMetric
          icon="gavel"
          title="Todavia no hiciste ofertas"
          text="Tus pujas y sus importes se van a listar en esta pantalla."
        />
      ) : (
        <Section title="Ultimas ofertas">
          {visible.map((item) => (
            <MetricItem key={item.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <Text style={{ color: p.text, fontSize: 15, fontWeight: '900', flex: 1 }}>
                  {item.producto || `Pieza #${item.item}`}
                </Text>
                {item.ganador === 'si' ? <MetricTag label="Ganadora" tone="success" /> : null}
              </View>
              <MetricRow label="Fecha" value={item.fechaHora ? formatDateTime(item.fechaHora) : 'Fecha no disponible'} />
              <MetricRow label="Subasta" value={`#${item.subasta}`} />
              <MetricRow label="Oferta" value={money(item.importe)} />
            </MetricItem>
          ))}
          <ViewAllButton
            expanded={expanded}
            total={pujas.length}
            onPress={() => setExpanded((value) => !value)}
          />
        </Section>
      )}
    </MetricScreen>
  );
}
