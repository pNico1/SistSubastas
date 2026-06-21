import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import {
  p, FadeUp, StatHeader, Bezel, VerTodasButton, money, formatFecha, softShadow,
} from './StatsKit';

const PREVIEW = 4;

const PAYMENT = {
  paid:      { label: 'Pagada',     color: p.success, bg: p.successFaint, icon: 'check-circle' },
  pending:   { label: 'Pendiente',  color: p.warning, bg: p.warningFaint, icon: 'schedule' },
  defaulted: { label: 'En mora',    color: p.danger,  bg: p.dangerFaint,  icon: 'error-outline' },
};

function VictoriaCard({ row, index }) {
  const auction = row.auction || {};
  const item = row.item || {};
  const bid = row.winningBid || {};
  const pay = PAYMENT[row.paymentStatus] || PAYMENT.pending;

  return (
    <FadeUp delay={120 + index * 70}>
      <Bezel style={styles.cardShell}>
        <View style={styles.cardInner}>
          {/* Pieza + miniatura */}
          <View style={styles.pieceRow}>
            {item.fotoPrincipal ? (
              <Image source={{ uri: item.fotoPrincipal }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <MaterialIcons name="image" size={20} color={p.muted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldKey}>Pieza</Text>
              <Text style={styles.pieceName} numberOfLines={1}>
                {item.descripcion || `Item ${item.id ?? '—'}`}
              </Text>
            </View>
            <View style={[styles.payBadge, { backgroundColor: pay.bg }]}>
              <MaterialIcons name={pay.icon} size={12} color={pay.color} />
              <Text style={[styles.payText, { color: pay.color }]}>{pay.label}</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.fieldKey}>Fecha</Text>
              <Text style={styles.metaValue}>{formatFecha(auction.fecha)}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.fieldKey}>Subasta</Text>
              <Text style={styles.metaValue}>
                #{auction.id ?? '—'}
                {auction.categoria ? `  ·  ${auction.categoria}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.bidRow}>
            <View>
              <Text style={styles.fieldKey}>Puja final</Text>
              <Text style={styles.bidValue}>{money(bid.importe, auction.moneda)}</Text>
            </View>
            <MaterialIcons name="emoji-events" size={26} color={p.tertiary} />
          </View>
        </View>
      </Bezel>
    </FadeUp>
  );
}

export default function VictoriasScreen({ navigation, route }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await clienteApi.victorias({
        page: 0,
        pageSize: 50,
        sort: 'auctionDate:desc',
      });
      const content = data?.content || [];
      setRows(content);
      setTotal(data?.totalElements ?? content.length);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading text="Cargando tus victorias..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const visible = expanded ? rows : rows.slice(0, PREVIEW);
  const hayMas = rows.length > PREVIEW;

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <StatHeader navigation={navigation} route={route} eyebrow="Estadística" title="Victorias" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        <FadeUp delay={90}>
          <View style={styles.tally}>
            <Text style={styles.tallyValue}>{total}</Text>
            <Text style={styles.tallyLabel}>subastas ganadas en total</Text>
          </View>
        </FadeUp>

        {rows.length === 0 ? (
          <FadeUp delay={120}>
            <View style={styles.empty}>
              <MaterialIcons name="emoji-events" size={40} color={p.border} />
              <Text style={styles.emptyText}>Todavía no tenés victorias registradas.</Text>
            </View>
          </FadeUp>
        ) : (
          <>
            {visible.map((row, i) => (
              <VictoriaCard key={row.purchaseId ?? `${row.auction?.id}-${i}`} row={row} index={i} />
            ))}

            {hayMas && (
              <View style={styles.ctaRow}>
                <VerTodasButton
                  label={expanded ? 'Ver menos' : 'Ver todas'}
                  count={expanded ? undefined : total}
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
  tallyValue: { fontSize: 30, fontWeight: '900', color: p.primary, letterSpacing: -1 },
  tallyLabel: { fontSize: 13, fontWeight: '600', color: p.muted, marginTop: 2 },

  cardShell: { marginBottom: 14 },
  cardInner: { padding: 16 },

  pieceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  thumb: { width: 46, height: 46, borderRadius: 14, backgroundColor: p.surfaceLow },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  pieceName: { fontSize: 16, fontWeight: '800', color: p.text, marginTop: 1 },

  payBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  payText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  metaGrid: {
    flexDirection: 'row', gap: 12,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: p.border,
  },
  metaCell: { flex: 1 },
  fieldKey: {
    fontSize: 9, fontWeight: '800', color: p.muted,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3,
  },
  metaValue: { fontSize: 14, fontWeight: '700', color: p.text },

  bidRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    marginTop: 14,
  },
  bidValue: { fontSize: 22, fontWeight: '900', color: p.text, letterSpacing: -0.5 },

  ctaRow: { marginTop: 8 },

  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: p.muted, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
