import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi, subastasApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import BottomNavBar from '../components/BottomNavBar';
import TopAppBar from '../components/TopAppBar';
import { useAuth } from '../context/AuthContext';

const p = {
  background:   '#F9F5FF',
  surface:      '#FFFFFF',
  surfaceLow:   '#F2EFFF',
  container:    '#E9E5FF',
  containerHigh:'#E2DFFF',
  primary:      '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.10)',
  secondary:    '#514EB6',
  secondaryFaint:'rgba(81,78,182,0.12)',
  tertiary:     '#913983',
  tertiaryFaint:'rgba(145,57,131,0.10)',
  text:         '#2B2A51',
  muted:        '#585781',
  border:       'rgba(171,169,215,0.35)',
  success:      '#16A34A',
  warning:      '#D97706',
  danger:       '#B41340',
  white:        '#FFFFFF',
};

function StatCard({ icon, label, value, accent, filled, onPress }) {
  return (
    <TouchableOpacity style={[styles.statCard, filled && { backgroundColor: p.primary }]} onPress={onPress} disabled={!onPress} activeOpacity={0.78}>
      <MaterialIcons
        name={icon}
        size={22}
        color={filled ? p.white : accent || p.primary}
        style={{ marginBottom: 4 }}
      />
      <Text style={[styles.statLabel, filled && { color: 'rgba(255,255,255,0.7)' }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, filled && { color: p.white }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{value}</Text>
      {onPress ? <MaterialIcons name="chevron-right" size={18} color={filled ? 'rgba(255,255,255,.78)' : p.primary} style={styles.statChevron} /> : null}
    </TouchableOpacity>
  );
}

function ActionRow({ icon, label, iconColor, iconBg, onPress }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <MaterialIcons name="chevron-right" size={22} color={p.muted} />
    </TouchableOpacity>
  );
}

function totalPagadoLabel(values) {
  if (!values.length) return 'ARS 0';
  const [moneda, importe] = values[0];
  return `${moneda} ${Number(importe || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}${values.length > 1 ? '+' : ''}`;
}

export default function PerfilScreen({ navigation }) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [perfil, setPerfil] = useState(null);
  const [pujas, setPujas] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [subastaActiva, setSubastaActiva] = useState(null);
  const [saliendo, setSaliendo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [pr, pj, asistencias, victorias, mis] = await Promise.all([
        clienteApi.perfil(),
        clienteApi.misPujas(),
        clienteApi.asistenciasStats(),
        clienteApi.victoriasStats(),
        clienteApi.misSubastas(),
      ]);
      setPerfil(pr);
      setPujas(pj || []);
      setMetricas({ asistencias, victorias });

      // Subasta abierta a la que el usuario esta unido (solo puede ser una).
      const abierta = (mis || []).find((m) => m.estado === 'abierta');
      if (abierta) {
        let detalle = null;
        try { detalle = await subastasApi.getById(abierta.subastaId); } catch { /* sin detalle */ }
        setSubastaActiva(detalle || { id: abierta.subastaId, estado: 'abierta' });
      } else {
        setSubastaActiva(null);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSalir = useCallback(async () => {
    try {
      setSaliendo(true);
      await clienteApi.salir();
      setSubastaActiva(null);
      await load();
    } catch (err) {
      Alert.alert('No se pudo salir', err?.response?.data?.message || 'Intentá de nuevo.');
    } finally {
      setSaliendo(false);
    }
  }, [load]);

  if (loading) return <View style={{ flex: 1, backgroundColor: p.background }}><TopAppBar navigation={navigation} /><Loading text="Cargando tu cuenta..." /><BottomNavBar navigation={navigation} /></View>;
  if (error) return <View style={{ flex: 1, backgroundColor: p.background }}><TopAppBar navigation={navigation} /><ErrorView error={error} onRetry={() => { setLoading(true); load(); }} /><BottomNavBar navigation={navigation} /></View>;

  const importesPagados = Object.entries(metricas?.victorias?.importesPorMoneda || {});
  const victorias = metricas?.victorias?.total || 0;
  const totalPagado = totalPagadoLabel(importesPagados);

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <TopAppBar navigation={navigation} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            {perfil.categoria ? (
              <View style={styles.badgeTertiary}>
                <Text style={styles.badgeTertiaryText}>
                  {perfil.categoria.toUpperCase()}
                </Text>
              </View>
            ) : null}
            <View style={styles.badgeVerified}>
              <MaterialIcons name="verified" size={11} color={p.primary} />
              <Text style={styles.badgeVerifiedText}>
                {perfil.admitido === 'si' ? 'Cuenta Verificada' : 'Pendiente'}
              </Text>
            </View>
          </View>

          <Text style={styles.nombre}>
            {perfil.nombre}{' '}
            <Text style={styles.nombreAccent}>{perfil.apellido}</Text>
          </Text>

          {perfil.pais ? (
            <Text style={styles.subline}>📍 {perfil.pais.nombre}</Text>
          ) : null}

          {importesPagados.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.assetLabel}>IMPORTES PAGADOS</Text>
              {importesPagados.map(([moneda, importe]) => (
                <Text key={moneda} style={styles.assetValue}>
                  {moneda} {Number(importe || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Cartel de subasta en curso (solo si esta unido a una abierta) */}
        {subastaActiva ? (
          <View style={styles.liveBanner}>
            <View style={styles.liveHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.liveTitle}>Estás participando en una subasta</Text>
            </View>
            <Text style={styles.liveSubasta}>
              Subasta #{subastaActiva.id}
              {subastaActiva.categoria ? `   ·   ${String(subastaActiva.categoria).toUpperCase()}` : ''}
            </Text>
            <View style={styles.liveActions}>
              <TouchableOpacity
                style={styles.liveGoBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('SubastaDetail', { id: subastaActiva.id })}
              >
                <MaterialIcons name="gavel" size={18} color={p.white} />
                <Text style={styles.liveGoText}>Ir a la subasta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.liveLeaveBtn}
                activeOpacity={0.85}
                disabled={saliendo}
                onPress={handleSalir}
              >
                <MaterialIcons name="logout" size={16} color={p.danger} />
                <Text style={styles.liveLeaveText}>{saliendo ? 'Saliendo…' : 'Salir'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="groups" label="Asistencias" value={metricas?.asistencias?.total || 0} onPress={() => navigation.navigate('MetricasAsistencias')} />
          <StatCard icon="emoji-events" label="Victorias" value={victorias} filled onPress={() => navigation.navigate('MetricasVictorias')} />
          <StatCard
            icon="payments"
            label="Total pagado"
            value={totalPagado}
            accent={p.tertiary}
            onPress={() => navigation.navigate('MetricasTotalPagado')}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <ActionRow
            icon="edit"
            label="Editar perfil"
            iconColor={p.primary}
            iconBg={p.primaryFaint}
            onPress={() => navigation.navigate('EditarPerfil')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="shopping-bag"
            label="Mis compras"
            iconColor={p.primary}
            iconBg={p.primaryFaint}
            onPress={() => navigation.navigate('MisAdquisiciones')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="history"
            label="Historial de subastas"
            iconColor={p.primary}
            iconBg={p.primaryFaint}
            onPress={() => navigation.navigate('HistorialSubastas')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="notifications"
            label="Notificaciones"
            iconColor={p.warning}
            iconBg="rgba(217,119,6,0.10)"
            onPress={() => navigation.navigate('Notificaciones')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="credit-card"
            label="Métodos de Pago"
            iconColor={p.secondary}
            iconBg={p.secondaryFaint}
            onPress={() => navigation.navigate('PaymentMethods')}
          />
          <View style={styles.divider} />
          <ActionRow
            icon="list-alt"
            label="Mis Publicaciones"
            iconColor={p.tertiary}
            iconBg={p.tertiaryFaint}
            onPress={() => navigation.navigate('MisProductos')}
          />
          <View style={styles.divider} />
          <ActionRow icon="account-balance" label="Cuenta para cobrar ventas" iconColor={p.primary} iconBg={p.primaryFaint} onPress={() => navigation.navigate('CuentaCobro')} />
          <View style={styles.divider} />
          <ActionRow icon="receipt-long" label="Liquidaciones de ventas" iconColor={p.success} iconBg="rgba(22,163,74,0.10)" onPress={() => navigation.navigate('Liquidaciones')} />
        </View>

        {/* Mis pujas recientes */}
        {pujas.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Mis pujas ({pujas.length})</Text>
            {pujas.map((item) => (
              <View key={item.id} style={styles.pujaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pujaTitle}>
                    {item.producto || `Item ${item.item}`}
                  </Text>
                  <Text style={styles.pujaSub}>Subasta {item.subasta}</Text>
                </View>
                <Text style={styles.pujaImporte}>${item.importe}</Text>
                {item.ganador === 'si' && (
                  <MaterialIcons name="emoji-events" size={18} color={p.tertiary} style={{ marginLeft: 6 }} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Security badge */}
        <View style={styles.secBadge}>
          <MaterialIcons name="verified-user" size={18} color={p.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.secTitle}>Subastas Seguras</Text>
            <Text style={styles.secText}>
              Tus datos y transacciones están protegidos con encriptación de nivel empresarial.
            </Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.85}
        >
          <MaterialIcons name="logout" size={18} color={p.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Header
  header: { marginBottom: 24 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  badgeTertiary: {
    backgroundColor: '#F790E0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeTertiaryText: {
    color: '#5F0656',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: p.primaryFaint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeVerifiedText: { color: p.primary, fontSize: 10, fontWeight: '800' },
  nombre: {
    fontSize: 36,
    fontWeight: '900',
    color: p.text,
    lineHeight: 42,
  },
  nombreAccent: { color: p.primary },
  subline: { color: p.muted, fontSize: 14, marginTop: 4 },
  assetLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: p.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  assetValue: { fontSize: 28, fontWeight: '900', color: p.text },

  // Live banner (subasta en curso)
  liveBanner: {
    backgroundColor: p.primaryFaint,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(8,70,237,0.25)',
  },
  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: p.success,
  },
  liveTitle: { fontSize: 13, fontWeight: '800', color: p.primary, letterSpacing: 0.2 },
  liveSubasta: { fontSize: 18, fontWeight: '900', color: p.text, marginTop: 8 },
  liveActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  liveGoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: p.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  liveGoText: { color: p.white, fontWeight: '800', fontSize: 14 },
  liveLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: p.danger,
    backgroundColor: p.surface,
  },
  liveLeaveText: { color: p.danger, fontWeight: '800', fontSize: 14 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    position: 'relative',
    backgroundColor: p.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: p.border,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: p.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '900', color: p.text },
  statChevron: { position: 'absolute', top: 8, right: 7 },

  // Actions
  actionsCard: {
    backgroundColor: p.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: p.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: p.text },
  divider: { height: 1, backgroundColor: p.border, marginLeft: 70 },

  // Pujas
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: p.text,
    marginBottom: 10,
  },
  pujaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: p.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: p.border,
  },
  pujaTitle: { fontWeight: '700', color: p.text, fontSize: 14 },
  pujaSub: { color: p.muted, fontSize: 12, marginTop: 2 },
  pujaImporte: { fontWeight: '800', color: p.primary, fontSize: 15 },

  // Security
  secBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: p.secondaryFaint,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(81,78,182,0.15)',
  },
  secTitle: { fontSize: 13, fontWeight: '800', color: p.text, marginBottom: 3 },
  secText: { fontSize: 12, color: p.muted, lineHeight: 18 },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: p.danger,
  },
  logoutText: { color: p.danger, fontWeight: '800', fontSize: 15 },
});
