import React, { useCallback, useState } from 'react';
import {
  FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { adquisicionesApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

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
  return ESTADOS[estado] || {
    label: estado ? estado.replaceAll('_', ' ') : 'Sin estado',
    icon: 'help-outline', color: palette.muted, bg: palette.surfaceLow,
  };
}

function CompraCard({ item, onPress }) {
  const estado = estadoConfig(item.estado);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.thumbnail}>
        <MaterialIcons name="inventory-2" size={26} color={palette.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.producto || `Producto #${item.productoId}`}
        </Text>
        <Text style={styles.importe}>${item.importe}</Text>
        <View style={[styles.badge, { backgroundColor: estado.bg }]}>
          <MaterialIcons name={estado.icon} size={14} color={estado.color} />
          <Text style={[styles.badgeText, { color: estado.color }]}>{estado.label}</Text>
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={palette.muted} />
    </TouchableOpacity>
  );
}

export default function MisAdquisicionesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await adquisicionesApi.listar();
      setItems(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loading text="Cargando tus compras..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.backButton} hitSlop={10}>
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis compras</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it, i) => String(it.id ?? i)}
        renderItem={({ item }) => (
          <CompraCard item={item} onPress={() => navigation.navigate('AdquisicionDetail', { id: item.id })} />
        )}
        contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={palette.primary} />}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="shopping-bag" size={38} color={palette.primary} />
            </View>
            <Text style={styles.emptyTitle}>Todavía no ganaste subastas</Text>
            <Text style={styles.emptyText}>Cuando ganes una pieza, vas a poder pagarla y seguir su entrega desde acá.</Text>
          </View>
        )}
      />
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
  list: { padding: 16 },
  emptyList: { flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12,
    borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
  },
  thumbnail: { width: 60, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primaryFaint },
  cardContent: { flex: 1, alignItems: 'flex-start' },
  cardTitle: { color: palette.text, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  importe: { color: palette.primary, fontSize: 15, fontWeight: '900', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, marginTop: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primaryFaint, marginBottom: 18 },
  emptyTitle: { color: palette.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: palette.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
});
