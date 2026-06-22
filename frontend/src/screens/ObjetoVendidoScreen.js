import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const p = {
  background: '#F9F5FF', surface: '#FFFFFF', surfaceLow: '#F2EFFF',
  primary: '#0846ED', text: '#2B2A51', muted: '#585781',
  border: 'rgba(171,169,215,0.35)', success: '#16803A', successFaint: '#E7F6EC',
};

const money = (moneda, value) => `${moneda || 'ARS'} ${Number(value || 0).toLocaleString('es-AR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})}`;

export default function ObjetoVendidoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try { setVenta(await productosApi.getVenta(id)); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <Loading text="Cargando la venta..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const compraEmpresa = venta.compradorTipo === 'EMPRESA';
  const fecha = venta.fechaVenta
    ? new Date(venta.fechaVenta).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })
    : 'A confirmar';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.back} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Objeto vendido</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.heroIcon}><MaterialIcons name="sell" size={38} color={p.success} /></View>
        <Text style={styles.title}>¡Tu pieza fue vendida!</Text>
        <Text style={styles.subtitle}>
          {compraEmpresa
            ? 'No recibió pujas, por eso la empresa la compró por el valor base.'
            : 'La subasta finalizó y la pieza fue adjudicada al mejor postor.'}
        </Text>

        <View style={styles.productCard}>
          {venta.foto ? <Image source={{ uri: venta.foto }} style={styles.image} /> : (
            <View style={[styles.image, styles.imageFallback]}><MaterialIcons name="image" size={32} color={p.primary} /></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{venta.descripcion || `Producto #${venta.productoId}`}</Text>
            <Text style={styles.meta}>Subasta #{venta.subastaId}</Text>
            <Text style={styles.meta}>{fecha}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Info label={compraEmpresa ? 'Valor base' : 'Precio final'} value={money(venta.moneda, venta.importeVenta)} />
          <Info label="Comisión" value={`− ${money(venta.moneda, venta.comisionImporte)}`} />
          <View style={styles.divider} />
          <Info label="Importe neto para vos" value={money(venta.moneda, venta.importeNeto)} strong />
        </View>

        <View style={styles.notice}>
          <MaterialIcons name="account-balance" size={22} color={p.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Liquidación de la venta</Text>
            <Text style={styles.noticeText}>
              El importe neto se enviará a la cuenta a la vista que declaraste para cobrar tus ventas.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MisProductos')}>
          <Text style={styles.buttonText}>Volver a mis publicaciones</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Info({ label, value, strong }) {
  return <View style={styles.row}>
    <Text style={[styles.label, strong && styles.strong]}>{label}</Text>
    <Text style={[styles.value, strong && styles.net]}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.border },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
  body: { padding: 22, paddingBottom: 40, alignItems: 'center' },
  heroIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: p.successFaint, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  title: { color: p.text, fontSize: 24, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  subtitle: { color: p.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  productCard: { width: '100%', flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: p.surface, borderRadius: 16, borderWidth: 1, borderColor: p.border, padding: 13 },
  image: { width: 76, height: 76, borderRadius: 12 },
  imageFallback: { backgroundColor: p.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  productName: { color: p.text, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  meta: { color: p.muted, fontSize: 11, marginTop: 4 },
  card: { width: '100%', backgroundColor: p.surface, borderRadius: 16, borderWidth: 1, borderColor: p.border, padding: 17, marginTop: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 8 },
  label: { color: p.muted, fontSize: 13, fontWeight: '700' },
  value: { flex: 1, color: p.text, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  divider: { height: 1, backgroundColor: p.border, marginVertical: 6 },
  strong: { color: p.text, fontSize: 14, fontWeight: '900' },
  net: { color: p.success, fontSize: 18, fontWeight: '900' },
  notice: { width: '100%', flexDirection: 'row', gap: 11, backgroundColor: p.surfaceLow, borderRadius: 14, padding: 15, marginTop: 14 },
  noticeTitle: { color: p.text, fontSize: 13, fontWeight: '900' },
  noticeText: { color: p.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  button: { width: '100%', minHeight: 52, borderRadius: 14, backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
