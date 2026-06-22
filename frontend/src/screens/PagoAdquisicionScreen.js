import React, { useCallback, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { adquisicionesApi, clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const palette = {
  background: '#F9F5FF', surface: '#FFFFFF', surfaceLow: '#F2EFFF',
  primary: '#0846ED', primaryFaint: 'rgba(8,70,237,0.10)',
  text: '#2B2A51', muted: '#585781', border: 'rgba(171,169,215,0.35)',
  success: '#16803A', danger: '#B41340',
};

function num(v) { return Number(v || 0); }

function medioLabel(m) {
  if (m.tipo === 'tarjeta') return `${m.marca || 'Tarjeta'} ····${m.ultimos4 || ''}`;
  if (m.tipo === 'cuenta_bancaria') return `${m.banco || 'Cuenta'} ····${(m.cbu || '').slice(-4)}`;
  return m.tipo ? m.tipo.replaceAll('_', ' ') : 'Medio de pago';
}

export default function PagoAdquisicionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;

  const [medios, setMedios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [compra, setCompra] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [data, detalle] = await Promise.all([
        clienteApi.metodosPago(), adquisicionesApi.getById(id),
      ]);
      setCompra(detalle);
      const verificados = (Array.isArray(data) ? data : []).filter((m) =>
        m.estado === 'verified' && (!m.moneda || m.moneda === detalle.moneda));
      setMedios(verificados);
      if (verificados.length === 1) setSelected(verificados[0].id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function pagar() {
    if (selected == null) {
      Alert.alert('Elegí un medio de pago', 'Seleccioná con qué medio querés pagar.');
      return;
    }
    const medio = medios.find((m) => m.id === selected);
    setPaying(true);
    try {
      await adquisicionesApi.pagar(id, {
        paymentMethodId: selected,
        moneda: medio?.moneda || 'ARS',
        confirmacionTerminos: true,
      });
      Alert.alert('Pago realizado', 'La pieza quedó pagada.', [
        { text: 'OK', onPress: () => navigation.replace('AdquisicionDetail', { id }) },
      ]);
    } catch (e) {
      Alert.alert('No se pudo pagar', e?.response?.data?.message || e.message || 'Intentá de nuevo.');
    } finally {
      setPaying(false);
    }
  }

  function informarSinFondos() {
    Alert.alert(
      'No puedo pagar ahora',
      'Se generará una multa del 10% de tu oferta. Deberás abonarla antes de participar nuevamente y presentar los fondos dentro de 72 horas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', style: 'destructive', onPress: async () => {
          try {
            const multa = await adquisicionesApi.declararSinFondos(id);
            navigation.replace('MultaDetail', { id: multa.id });
          } catch (e) {
            Alert.alert('No se pudo registrar', e?.response?.data?.message || e.message);
          }
        } },
      ],
    );
  }

  if (loading) return <Loading text="Cargando medios de pago..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  const total = num(compra?.total);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.backButton} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagar compra</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
          <Text style={styles.totalValue}>{compra?.moneda || 'ARS'} {total.toLocaleString('es-AR')}</Text>
          <Text style={styles.totalSub}>
            Incluye {num(compra?.importe).toLocaleString('es-AR')} de oferta + {num(compra?.comision).toLocaleString('es-AR')} de comisión + {num(compra?.costoEnvio).toLocaleString('es-AR')} de envío
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Elegí tu medio de pago</Text>

        {medios.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No tenés medios de pago verificados.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods')}>
              <Text style={styles.emptyLink}>Agregar un medio de pago</Text>
            </TouchableOpacity>
          </View>
        ) : (
          medios.map((m) => {
            const sel = m.id === selected;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.medio, sel && styles.medioSel]}
                activeOpacity={0.85}
                onPress={() => setSelected(m.id)}
              >
                <MaterialIcons
                  name={m.tipo === 'tarjeta' ? 'credit-card' : 'account-balance'}
                  size={22}
                  color={sel ? palette.primary : palette.muted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.medioTitle}>{medioLabel(m)}</Text>
                  {m.titular ? <Text style={styles.medioSub}>{m.titular}</Text> : null}
                </View>
                <MaterialIcons
                  name={sel ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={22}
                  color={sel ? palette.primary : palette.muted}
                />
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity
          style={[styles.payBtn, (paying || medios.length === 0) && { opacity: 0.6 }]}
          activeOpacity={0.85}
          disabled={paying || medios.length === 0}
          onPress={pagar}
        >
          {paying ? <ActivityIndicator color="#fff" />
            : <><MaterialIcons name="lock" size={18} color="#fff" /><Text style={styles.payBtnText}>Pagar ahora</Text></>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.noFunds} onPress={informarSinFondos} disabled={paying}>
          <Text style={styles.noFundsText}>No tengo fondos para pagar ahora</Text>
        </TouchableOpacity>
      </ScrollView>
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
  totalCard: { backgroundColor: palette.primary, borderRadius: 16, padding: 20, alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  totalValue: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 4 },
  totalSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 6, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: palette.text, marginTop: 24, marginBottom: 12 },
  medio: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 10,
    borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.border,
  },
  medioSel: { borderColor: palette.primary, backgroundColor: palette.primaryFaint },
  medioTitle: { color: palette.text, fontSize: 15, fontWeight: '700' },
  medioSub: { color: palette.muted, fontSize: 12, marginTop: 2 },
  emptyBox: { backgroundColor: palette.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: palette.border, alignItems: 'center', gap: 8 },
  emptyText: { color: palette.muted, fontSize: 14 },
  emptyLink: { color: palette.primary, fontWeight: '800', fontSize: 14 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: palette.primary, borderRadius: 14, paddingVertical: 16, marginTop: 24,
  },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  noFunds: { alignItems: 'center', paddingVertical: 14, marginTop: 7 },
  noFundsText: { color: palette.danger, fontSize: 13, fontWeight: '800' },
});
