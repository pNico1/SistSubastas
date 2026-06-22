import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const palette = {
  background: '#F9F5FF',
  surface: '#FFFFFF',
  surfaceLow: '#F2EFFF',
  primary: '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.10)',
  text: '#2B2A51',
  muted: '#585781',
  border: 'rgba(171,169,215,0.35)',
  success: '#16803A',
  successFaint: '#E7F6EC',
  danger: '#B41340',
  dangerFaint: 'rgba(180,19,64,0.08)',
  warning: '#B45309',
  warningFaint: '#FEF3C7',
};

const ESTADOS = {
  en_revision: {
    label: 'En revisión', icon: 'hourglass-top', color: palette.warning, bg: palette.warningFaint,
  },
  aprobado: {
    label: 'Aceptado', icon: 'check-circle', color: palette.success, bg: palette.successFaint,
  },
  aceptado: {
    label: 'Aceptado', icon: 'check-circle', color: palette.success, bg: palette.successFaint,
  },
  rechazado: {
    label: 'Rechazado', icon: 'cancel', color: palette.danger, bg: palette.dangerFaint,
  },
  en_subasta: {
    label: 'En subasta', icon: 'gavel', color: palette.primary, bg: palette.primaryFaint,
  },
  vendido: {
    label: 'Vendido', icon: 'sell', color: palette.success, bg: palette.successFaint,
  },
  devuelto: {
    label: 'Devuelto', icon: 'assignment-return', color: palette.muted, bg: palette.surfaceLow,
  },
  en_devolucion: {
    label: 'En devolución', icon: 'local-shipping', color: palette.muted, bg: palette.surfaceLow,
  },
  pendiente_terminos: {
    label: 'Requiere confirmación', icon: 'fact-check', color: palette.warning, bg: palette.warningFaint,
  },
};

function estadoConfig(estado) {
  return ESTADOS[estado] || {
    label: estado ? estado.replaceAll('_', ' ') : 'Sin estado',
    icon: 'help-outline',
    color: palette.muted,
    bg: palette.surfaceLow,
  };
}

function normalizarProductos(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.content)) return response.content;
  return [];
}

const ESTADOS_CON_SEGURO = new Set(['aprobado', 'aceptado', 'en_subasta']);

function ProductoCard({ producto, onPress, onSeguro, onVenta }) {
  const estado = estadoConfig(producto.estado);
  const id = producto.productoId ?? producto.id;
  const puedeGestionarSeguro = ESTADOS_CON_SEGURO.has(producto.estado) && !!producto.seguro;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardMain}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${producto.descripcionCatalogo || `producto ${id}`}`}
      >
        <View style={styles.thumbnail}>
          <MaterialIcons name="image" size={28} color={palette.primary} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {producto.descripcionCatalogo || `Producto #${id}`}
          </Text>
          {producto.nombreArtista ? (
            <Text style={styles.artist} numberOfLines={1}>{producto.nombreArtista}</Text>
          ) : null}
          <View style={[styles.badge, { backgroundColor: estado.bg }]}>
            <MaterialIcons name={estado.icon} size={14} color={estado.color} />
            <Text style={[styles.badgeText, { color: estado.color }]}>{estado.label}</Text>
          </View>
        </View>

        <MaterialIcons name="chevron-right" size={24} color={palette.muted} />
      </TouchableOpacity>
      {puedeGestionarSeguro ? (
        <TouchableOpacity style={styles.policyAction} onPress={onSeguro} activeOpacity={0.8}>
          <MaterialIcons name="verified-user" size={17} color={palette.primary} />
          <Text style={styles.policyActionText}>Ver póliza y mejorar cobertura</Text>
          <MaterialIcons name="arrow-forward" size={16} color={palette.primary} />
        </TouchableOpacity>
      ) : null}
      {producto.estado === 'vendido' ? (
        <TouchableOpacity style={styles.policyAction} onPress={onVenta} activeOpacity={0.8}>
          <MaterialIcons name="receipt-long" size={17} color={palette.success} />
          <Text style={[styles.policyActionText, { color: palette.success }]}>Ver detalle de la venta</Text>
          <MaterialIcons name="arrow-forward" size={16} color={palette.success} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function MisProductosScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await productosApi.misProductos();
      setProductos(normalizarProductos(response));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openProducto(producto) {
    const id = producto.productoId ?? producto.id;
    if (id != null) navigation.navigate('ProductoDetail', { id });
  }

  if (loading) return <Loading text="Cargando tus productos..." />;
  if (error) {
    return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => goBackOrReturnTo(navigation, route)}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis productos</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={productos}
        keyExtractor={(item, index) => String(item.productoId ?? item.id ?? index)}
        renderItem={({ item }) => (
          <ProductoCard
            producto={item}
            onPress={() => openProducto(item)}
            onSeguro={() => navigation.navigate('PolizaProducto', { id: item.productoId ?? item.id })}
            onVenta={() => navigation.navigate('ObjetoVendido', { id: item.productoId ?? item.id })}
          />
        )}
        contentContainerStyle={[
          styles.list,
          productos.length === 0 && styles.emptyList,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={palette.primary}
          />
        )}
        ListHeaderComponent={productos.length > 0 ? (
          <Text style={styles.summary}>
            {productos.length} {productos.length === 1 ? 'producto publicado' : 'productos publicados'}
          </Text>
        ) : null}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="inventory-2" size={38} color={palette.primary} />
            </View>
            <Text style={styles.emptyTitle}>Todavía no ofreciste productos</Text>
            <Text style={styles.emptyText}>
              Cuando publiques un bien, vas a poder seguir su revisión y estado desde acá.
            </Text>
            <TouchableOpacity
              style={styles.offerButton}
              onPress={() => navigation.navigate('OfrecerBien')}
              activeOpacity={0.85}
            >
              <Text style={styles.offerButtonText}>Ofrecer un bien</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: palette.text },
  headerSpacer: { width: 36 },
  list: { padding: 16 },
  emptyList: { flexGrow: 1 },
  summary: { color: palette.muted, fontSize: 13, fontWeight: '600', marginBottom: 12 },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primaryFaint,
  },
  cardContent: { flex: 1, alignItems: 'flex-start' },
  cardTitle: { color: palette.text, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  artist: { color: palette.muted, fontSize: 12, marginTop: 3 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 9,
  },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  policyAction: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: palette.primaryFaint, borderTopWidth: 1, borderTopColor: palette.border },
  policyActionText: { flex: 1, color: palette.primary, fontSize: 12, fontWeight: '800' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primaryFaint,
    marginBottom: 18,
  },
  emptyTitle: { color: palette.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyText: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
  },
  offerButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  offerButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
