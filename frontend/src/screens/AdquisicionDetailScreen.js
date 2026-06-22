import React, { useCallback, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { adquisicionesApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';
import ScreenHeader from '../components/ScreenHeader';

const palette = {
  background: '#F9F5FF', surface: '#FFFFFF', surfaceLow: '#F2EFFF',
  primary: '#0846ED', primaryFaint: 'rgba(8,70,237,0.10)',
  text: '#2B2A51', muted: '#585781', border: 'rgba(171,169,215,0.35)',
  success: '#16803A', successFaint: '#E7F6EC',
  danger: '#B41340', dangerFaint: 'rgba(180,19,64,0.08)',
  warning: '#B45309', warningFaint: '#FEF3C7',
};

const ESTADOS = {
  pendiente: { label: 'Pendiente de pago', icon: 'schedule', color: palette.warning, bg: palette.warningFaint },
  en_mora:   { label: 'En mora', icon: 'gavel', color: palette.danger, bg: palette.dangerFaint },
  pagado:    { label: 'Pagado', icon: 'check-circle', color: palette.success, bg: palette.successFaint },
  entregado: { label: 'Entregado', icon: 'local-shipping', color: palette.primary, bg: palette.primaryFaint },
};

function estadoConfig(estado) {
  return ESTADOS[estado] || { label: estado || 'Sin estado', icon: 'help-outline', color: palette.muted, bg: palette.surfaceLow };
}

function num(v) { return Number(v || 0); }

export default function AdquisicionDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [adq, setAdq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entrega, setEntrega] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const compra = await adquisicionesApi.getById(id);
      setAdq(compra);
      if (compra.entregaDefinida) {
        try { setEntrega(await adquisicionesApi.entrega(id)); } catch { setEntrega(null); }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading text="Cargando compra..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const estado = estadoConfig(adq.estado);
  const total = num(adq.total);
  const pagable = adq.estado === 'pendiente' || adq.estado === 'en_mora';

  return (
    <View style={styles.screen}>
      <ScreenHeader navigation={navigation} route={route} title="Detalle de compra" />

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.producto}>{adq.producto || `Producto #${adq.productoId}`}</Text>
        <View style={[styles.badge, { backgroundColor: estado.bg, alignSelf: 'flex-start' }]}>
          <MaterialIcons name={estado.icon} size={15} color={estado.color} />
          <Text style={[styles.badgeText, { color: estado.color }]}>{estado.label}</Text>
        </View>

        <View style={styles.card}>
          <Row label="Importe ofertado" value={`$${num(adq.importe).toLocaleString('es-AR')}`} />
          <Row label="Costo de envío" value={`$${num(adq.costoEnvio).toLocaleString('es-AR')}`} />
          <Row label="Comisión" value={`$${num(adq.comision).toLocaleString('es-AR')}`} />
          <View style={styles.divider} />
          <Row label="Total a pagar" value={`$${total.toLocaleString('es-AR')}`} strong />
        </View>

        {adq.estado === 'en_mora' ? (
          <View style={styles.warnBox}>
            <MaterialIcons name="warning-amber" size={18} color={palette.danger} />
            <Text style={styles.warnText}>
              El plazo de pago venció. Se generó una multa que debés abonar antes de participar en otra subasta.
            </Text>
          </View>
        ) : null}

        {entrega ? (
          <View style={styles.card}>
            <Row label="Modalidad" value={entrega.tipo === 'envio' ? 'Envío a domicilio' : 'Retiro personal'} />
            <Row label="Dirección" value={entrega.direccion || 'A confirmar'} />
            <Row label="Fecha estimada" value={entrega.fechaEstimada || 'A confirmar'} />
          </View>
        ) : null}

        {pagable ? (
          <TouchableOpacity
            style={styles.payBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(adq.entregaDefinida ? 'PagoAdquisicion' : 'EntregaCompra', { id: adq.id })}
          >
            <MaterialIcons name="payments" size={20} color="#fff" />
            <Text style={styles.payBtnText}>{adq.entregaDefinida ? `Pagar $${total.toLocaleString('es-AR')}` : 'Elegir retiro o envío'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paidBox}>
            <MaterialIcons name="check-circle" size={20} color={palette.success} />
            <Text style={styles.paidText}>Esta compra ya fue pagada.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && { color: palette.text, fontWeight: '800' }]}>{label}</Text>
      <Text style={[styles.rowValue, strong && { fontSize: 20, color: palette.primary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, backgroundColor: palette.surface,
    borderBottomWidth: 1, borderBottomColor: palette.border,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: palette.text },
  headerSpacer: { width: 36 },
  body: { padding: 20 },
  producto: { fontSize: 24, fontWeight: '900', color: palette.text, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  card: {
    backgroundColor: palette.surface, borderRadius: 16, padding: 18, marginTop: 18,
    borderWidth: 1, borderColor: palette.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { color: palette.muted, fontSize: 14, fontWeight: '600' },
  rowValue: { color: palette.text, fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: 8 },
  warnBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: palette.dangerFaint,
    borderRadius: 12, padding: 14, marginTop: 16,
  },
  warnText: { flex: 1, color: palette.danger, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: palette.primary, borderRadius: 14, paddingVertical: 16, marginTop: 22,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  paidBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: palette.successFaint, borderRadius: 14, paddingVertical: 16, marginTop: 22,
  },
  paidText: { color: palette.success, fontSize: 15, fontWeight: '800' },
});
