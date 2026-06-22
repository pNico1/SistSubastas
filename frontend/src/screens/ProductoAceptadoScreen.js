import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const p = {
  background: '#F9F5FF', surface: '#FFFFFF', surfaceLow: '#F2EFFF',
  primary: '#0846ED', primaryFaint: 'rgba(8,70,237,0.10)',
  text: '#2B2A51', muted: '#585781', border: 'rgba(171,169,215,0.35)',
  success: '#16803A', successFaint: '#E7F6EC',
};

export default function ProductoAceptadoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setError(null);
    try { setProducto(await productosApi.getById(id)); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <Loading text="Cargando propuesta..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.back} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Producto aceptado</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.successIcon}><MaterialIcons name="check-circle" size={38} color={p.success} /></View>
        <Text style={styles.title}>La pieza fue aceptada</Text>
        <Text style={styles.product}>{producto.descripcionCatalogo || 'Producto #' + id}</Text>
        <Text style={styles.intro}>Revisá las condiciones propuestas antes de confirmar su inclusión en la subasta.</Text>

        <View style={styles.card}>
          <Info label="Fecha" value={producto.subastaFecha} />
          <Info label="Hora" value={producto.subastaHora} />
          <Info label="Lugar" value={producto.deposito} />
          <Info label="Valor base" value={producto.precioBase == null ? null : (producto.moneda || 'ARS') + ' ' + producto.precioBase} />
          <Info label="Comisión" value={producto.comision == null ? null : (producto.moneda || 'ARS') + ' ' + Number(producto.comision).toLocaleString('es-AR')} />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('AceptarTerminos', { id })}>
          <MaterialIcons name="fact-check" size={19} color="#FFFFFF" />
          <Text style={styles.primaryText}>Aceptar o rechazar condiciones</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'A confirmar'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.border },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
  body: { padding: 22, paddingBottom: 36, alignItems: 'center' },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: p.successFaint, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  title: { color: p.text, fontSize: 23, fontWeight: '900', marginTop: 16, textAlign: 'center' },
  product: { color: p.success, fontSize: 14, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  intro: { color: p.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  card: { width: '100%', backgroundColor: p.surface, borderRadius: 16, borderWidth: 1, borderColor: p.border, padding: 17 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.border },
  infoLabel: { color: p.muted, fontSize: 13, fontWeight: '700' },
  infoValue: { flex: 1, color: p.text, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  primaryButton: { width: '100%', minHeight: 54, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: p.primary, borderRadius: 14, marginTop: 20 },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
