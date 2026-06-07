import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

// "Mi cuenta": perfil del cliente, acceso a medios de pago e historial de pujas.
export default function PerfilScreen({ navigation }) {
  const { logout } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [pujas, setPujas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, pj] = await Promise.all([
        clienteApi.perfil(),
        clienteApi.misPujas(),
      ]);
      setPerfil(p);
      setPujas(pj || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loading text="Cargando tu cuenta..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.card}>
        <Text style={styles.nombre}>{perfil.nombre} {perfil.apellido}</Text>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{perfil.categoria}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: perfil.admitido === 'si' ? colors.success : colors.warning }]}>
            <Text style={styles.badgeText}>{perfil.admitido === 'si' ? 'admitido' : 'no admitido'}</Text>
          </View>
        </View>
        {perfil.pais ? <Text style={styles.line}>Pais: {perfil.pais.nombre}</Text> : null}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Medios de pago</Text>
        <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods')}>
          <Text style={styles.action}>Agregar metodo de pago</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => navigation.navigate('PaymentMethods')}
        style={styles.paymentShortcut}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.paymentShortcutTitle}>Administrar medios</Text>
          <Text style={styles.paymentShortcutText}>Ver tus medios cargados o agregar uno nuevo.</Text>
        </View>
        <Text style={styles.paymentShortcutArrow}>+</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Mis pujas ({pujas.length})</Text>
      {pujas.length === 0 ? (
        <Text style={styles.empty}>Todavia no hiciste ninguna puja.</Text>
      ) : (
        pujas.map((p) => (
          <View key={p.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{p.producto || `Item ${p.item}`}</Text>
              <Text style={styles.itemSub}>Subasta {p.subasta}</Text>
            </View>
            <Text style={styles.importe}>${p.importe}</Text>
            {p.ganador === 'si' ? <Text style={styles.gano}>G</Text> : null}
          </View>
        ))
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nombre: { fontSize: 20, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  line: { color: colors.textMuted, marginTop: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  action: { color: colors.primary, fontWeight: '700' },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  paymentShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentShortcutTitle: { color: colors.text, fontWeight: '700' },
  paymentShortcutText: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  paymentShortcutArrow: { color: colors.primary, fontSize: 26, fontWeight: '800' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTitle: { fontWeight: '600', color: colors.text },
  itemSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  importe: { fontWeight: '800', color: colors.primary },
  gano: { fontSize: 18, fontWeight: '800', color: colors.accent },
  logoutBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
