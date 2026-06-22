import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';
import ScreenHeader from '../components/ScreenHeader';

const p = {
  background: '#F9F5FF', surface: '#FFFFFF', surfaceLow: '#F2EFFF',
  primary: '#0846ED', primaryFaint: 'rgba(8,70,237,0.10)',
  text: '#2B2A51', muted: '#585781', border: 'rgba(171,169,215,0.35)',
  warning: '#B45309', warningFaint: '#FEF3C7',
};

export default function DireccionInspeccionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try { setData(await productosApi.getEnvioInspeccion(id)); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <Loading text="Cargando dirección..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={styles.screen}>
      <ScreenHeader navigation={navigation} route={route} title="Envío para inspección" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="inventory" size={34} color={p.primary} />
        </View>
        <Text style={styles.title}>Tu solicitud fue recibida</Text>
        <Text style={styles.product}>{data.producto || 'Producto #' + data.productoId}</Text>
        <Text style={styles.intro}>{data.indicaciones}</Text>

        <View style={styles.addressCard}>
          <View style={styles.addressIcon}>
            <MaterialIcons name="location-on" size={22} color={p.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>DIRECCIÓN DE INSPECCIÓN</Text>
            <Text style={styles.address}>{data.direccion}</Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <MaterialIcons name="info-outline" size={20} color={p.warning} />
          <Text style={styles.warningText}>{data.condicionDevolucion}</Text>
        </View>

        <TouchableOpacity style={styles.productButton} onPress={() => navigation.navigate('ProductoDetail', { id })}>
          <Text style={styles.productButtonText}>Ver estado del producto</Text>
          <MaterialIcons name="chevron-right" size={20} color={p.primary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.border },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
  body: { padding: 22, paddingBottom: 36, alignItems: 'center' },
  heroIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: p.primaryFaint, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  title: { color: p.text, fontSize: 22, fontWeight: '900', marginTop: 16, textAlign: 'center' },
  product: { color: p.primary, fontSize: 14, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  intro: { color: p.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  addressCard: { width: '100%', flexDirection: 'row', gap: 12, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 16, padding: 17 },
  addressIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: p.primaryFaint, alignItems: 'center', justifyContent: 'center' },
  addressLabel: { color: p.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  address: { color: p.text, fontSize: 16, fontWeight: '800', lineHeight: 22, marginTop: 5 },
  warningCard: { width: '100%', flexDirection: 'row', gap: 10, backgroundColor: p.warningFaint, borderRadius: 13, padding: 14, marginTop: 14 },
  warningText: { flex: 1, color: p.warning, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  productButton: { width: '100%', minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 22, borderRadius: 13, borderWidth: 1, borderColor: p.primary, backgroundColor: p.surface },
  productButtonText: { color: p.primary, fontSize: 14, fontWeight: '800' },
});
