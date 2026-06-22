import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const p = {
  background:   '#F9F5FF',
  surface:      '#FFFFFF',
  surfaceLow:   '#F2EFFF',
  primary:      '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.10)',
  text:         '#2B2A51',
  muted:        '#585781',
  border:       'rgba(171,169,215,0.35)',
  success:      '#16A34A',
  successFaint: '#E7F6EC',
  danger:       '#B41340',
  dangerFaint:  'rgba(180,19,64,0.08)',
  warning:      '#D97706',
  warningFaint: '#FEF3C7',
  white:        '#FFFFFF',
};

// Mapeo de tipo de notificación -> icono / colores
const TIPO_CONFIG = {
  VENTA: { icon: 'sell', color: p.success, bg: p.successFaint },
  ACEPTADO: { icon: 'check-circle', color: p.success, bg: p.successFaint },
  RECHAZADO: { icon: 'cancel', color: p.danger, bg: p.dangerFaint },
  CUENTA: { icon: 'verified-user', color: p.primary, bg: p.primaryFaint },
  MULTA: { icon: 'warning', color: p.warning, bg: p.warningFaint },
  ENVIO_INSPECCION: { icon: 'local-shipping', color: p.primary, bg: p.primaryFaint },
  PRODUCTO_ACEPTADO: { icon: 'check-circle', color: p.success, bg: p.successFaint },
  PRODUCTO_RECHAZADO: { icon: 'cancel', color: p.danger, bg: p.dangerFaint },
  SEGURO_APROBADO: { icon: 'verified-user', color: p.success, bg: p.successFaint },
  SEGURO_RECHAZADO: { icon: 'shield', color: p.danger, bg: p.dangerFaint },
  OBJETO_VENDIDO: { icon: 'sell', color: p.success, bg: p.successFaint },
  PUJA_GANADA: { icon: 'emoji-events', color: p.success, bg: p.successFaint },
  PAGO_CONFIRMADO: { icon: 'payments', color: p.success, bg: p.successFaint },
  MULTA: { icon: 'gavel', color: p.danger, bg: p.dangerFaint },
  MULTA_PAGADA: { icon: 'check-circle', color: p.success, bg: p.successFaint },
  DEFAULT: { icon: 'notifications', color: p.muted, bg: p.surfaceLow },
};

function getConfig(tipo) {
  const base = (tipo || '').split(':')[0].toUpperCase();
  return TIPO_CONFIG[base] || TIPO_CONFIG.DEFAULT;
}

function notificationTarget(tipo) {
  const [base, rawId] = (tipo || '').split(':');
  const id = Number(rawId);
  if (!Number.isInteger(id)) return null;
  if (base === 'ENVIO_INSPECCION') return { screen: 'DireccionInspeccion', params: { id } };
  if (base === 'PRODUCTO_ACEPTADO') return { screen: 'ProductoAceptado', params: { id } };
  if (base === 'PRODUCTO_RECHAZADO') return { screen: 'MotivoRechazo', params: { id } };
  if (base === 'OBJETO_VENDIDO') return { screen: 'ObjetoVendido', params: { id } };
  if (base === 'PUJA_GANADA') return { screen: 'EntregaCompra', params: { id } };
  if (base === 'PAGO_CONFIRMADO') return { screen: 'AdquisicionDetail', params: { id } };
  if (base === 'MULTA' || base === 'MULTA_PAGADA') return { screen: 'MultaDetail', params: { id } };
  if (base === 'SEGURO_APROBADO' || base === 'SEGURO_RECHAZADO') {
    return { screen: 'PolizaProducto', params: { id } };
  }
  return null;
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '';
  try {
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return fechaStr;
  }
}

export default function NotificacionesScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await clienteApi.notificaciones();
      // Más recientes primero
      const ordenadas = [...(data || [])].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
      setItems(ordenadas);
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

  async function onPressNotif(notif) {
    if (!notif.leido) {
      // Optimista: la marcamos leída en pantalla al toque
      setItems((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n))
      );
      try {
        await clienteApi.marcarNotificacionLeida(notif.id);
      } catch (err) {
        // si falla, revertimos
        setItems((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, leido: false } : n))
        );
      }
    }
    const target = notificationTarget(notif.tipo);
    if (target) navigation.navigate(target.screen, target.params);
  }

  if (loading) return <Loading text="Cargando notificaciones..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBackOrReturnTo(navigation, route)}
          style={styles.backBtn}
          hitSlop={10}
        >
          <MaterialIcons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="notifications-none" size={40} color={p.border} />
            <Text style={styles.emptyText}>No tenés notificaciones todavía.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const config = getConfig(item.tipo);
          return (
            <TouchableOpacity
              style={[styles.notifCard, !item.leido && styles.notifCardUnread]}
              onPress={() => onPressNotif(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                <MaterialIcons name={config.icon} size={20} color={config.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifMensaje} numberOfLines={3}>
                  {item.mensaje}
                </Text>
                <Text style={styles.notifFecha}>{formatFecha(item.fecha)}</Text>
              </View>
              {!item.leido && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14,
    backgroundColor: p.surface,
    borderBottomWidth: 1, borderBottomColor: p.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: p.surfaceLow,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: p.text },

  list: { padding: 16, paddingBottom: 32 },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: p.surface,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: p.border,
  },
  notifCardUnread: {
    backgroundColor: p.primaryFaint,
    borderColor: 'rgba(8,70,237,0.18)',
  },
  notifIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  notifMensaje: { fontSize: 14, fontWeight: '600', color: p.text, lineHeight: 20 },
  notifFecha: { fontSize: 11, color: p.muted, marginTop: 6, fontWeight: '600' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: p.primary, marginTop: 4,
  },

  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { color: p.muted, fontSize: 14, fontWeight: '600' },
});
