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
  warning: '#B45309', warningFaint: '#FEF3C7',
};

export default function PolizaProductoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [seguro, setSeguro] = useState(null);
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [poliza, detalle] = await Promise.all([
        productosApi.getSeguros(id),
        productosApi.getById(id),
      ]);
      setSeguro(poliza);
      setProducto(detalle);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  if (loading) return <Loading text="Cargando póliza..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const pendiente = seguro.estadoSolicitud === 'pendiente';
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.back} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Póliza de seguro</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.heroIcon}>
          <MaterialIcons name="verified-user" size={36} color={p.primary} />
        </View>
        <Text style={styles.title}>{producto.descripcionCatalogo || 'Producto #' + id}</Text>
        <Text style={styles.subtitle}>Cobertura contratada por la empresa de subastas para esta pieza.</Text>

        <View style={styles.card}>
          <View style={styles.policyHeader}>
            <View>
              <Text style={styles.smallLabel}>NÚMERO DE PÓLIZA</Text>
              <Text style={styles.policyNumber}>{seguro.numero}</Text>
            </View>
            <View style={styles.activeBadge}>
              <MaterialIcons name="check-circle" size={14} color={p.success} />
              <Text style={styles.activeText}>Vigente</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Info label="Compañía" value={seguro.compania} />
          <Info label="Cobertura" value={seguro.cobertura} />
          <Info label="Valor asegurado" value={(seguro.moneda || 'ARS') + ' ' + seguro.valorAsegurado} />
        </View>

        {pendiente ? (
          <View style={styles.pendingCard}>
            <MaterialIcons name="schedule" size={20} color={p.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Aumento en evaluación</Text>
              <Text style={styles.pendingText}>Ya existe una solicitud pendiente para esta póliza.</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('UpgradeSeguro', { id })}
            activeOpacity={0.85}
          >
            <MaterialIcons name="trending-up" size={20} color="#FFFFFF" />
            <Text style={styles.upgradeText}>Mejorar cobertura</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          El aumento se solicita a la compañía aseguradora y requiere abonar la diferencia del premio.
        </Text>
      </ScrollView>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'No informado'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.border },
  back: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surfaceLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: p.text, fontSize: 16, fontWeight: '800' },
  body: { padding: 22, paddingBottom: 36, alignItems: 'center' },
  heroIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: p.primaryFaint, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  title: { color: p.text, fontSize: 21, fontWeight: '900', textAlign: 'center', marginTop: 15 },
  subtitle: { color: p.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, marginBottom: 20 },
  card: { width: '100%', backgroundColor: p.surface, borderRadius: 16, borderWidth: 1, borderColor: p.border, padding: 17 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallLabel: { color: p.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  policyNumber: { color: p.text, fontSize: 19, fontWeight: '900', marginTop: 5 },
  activeBadge: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: p.successFaint, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999 },
  activeText: { color: p.success, fontSize: 10, fontWeight: '900' },
  divider: { height: 1, backgroundColor: p.border, marginVertical: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 8 },
  infoLabel: { color: p.muted, fontSize: 13, fontWeight: '600' },
  infoValue: { flex: 1, color: p.text, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  pendingCard: { width: '100%', flexDirection: 'row', gap: 10, backgroundColor: p.warningFaint, borderRadius: 13, padding: 14, marginTop: 16 },
  pendingTitle: { color: p.warning, fontSize: 13, fontWeight: '900' },
  pendingText: { color: p.warning, fontSize: 12, lineHeight: 18, marginTop: 3 },
  upgradeButton: { width: '100%', minHeight: 54, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: p.primary, borderRadius: 14, marginTop: 18 },
  upgradeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  note: { color: p.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 },
});
