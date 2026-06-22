import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { subastasApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { colors, radius, spacing } from '../theme';
import { navigateWithReturnTo } from '../navigationUtils';

export default function SubastasListScreen({ navigation }) {
  const { user } = useAuth();
  const [subastas, setSubastas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const pendingVerification = user?.estado === 'pending_verification';

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await subastasApi.listar({ estado: 'abierta', pageSize: 50 });
      setSubastas(res.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  function openSubasta(id) {
    if (pendingVerification) {
      Alert.alert(
        'Cuenta pendiente',
        'Tu cuenta todavia esta en proceso de verificacion. Vas a poder entrar a las subastas cuando un administrador la apruebe.'
      );
      return;
    }
    navigateWithReturnTo(navigation, 'SubastaDetail', { id });
  }

  if (loading) return <Loading text="Cargando subastas..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      data={subastas}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        pendingVerification ? (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingTitle}>Cuenta en verificacion</Text>
            <Text style={styles.pendingText}>
              Podes ver las subastas disponibles, pero no entrar ni participar hasta que un administrador apruebe tu cuenta.
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={<Text style={styles.empty}>No hay subastas abiertas en este momento.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => openSubasta(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardImageWrap}>
            {item.imagenUrl ? (
              <ImageBackground source={{ uri: item.imagenUrl }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.cardImage, styles.cardImageFallback]}>
                <MaterialIcons name="image" size={40} color="rgba(8,70,237,0.25)" />
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Subasta #{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={styles.badgeText}>{item.categoria}</Text>
              </View>
            </View>
            <Text style={styles.cardLine}>Fecha: {item.fecha} - {item.hora}</Text>
            <Text style={styles.cardLine}>Ubicacion: {item.ubicacion}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMeta}>{item.cantidadItems} items - {item.moneda}</Text>
              <Text style={styles.estado}>{item.estado}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  pendingBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingTitle: { color: colors.warning, fontWeight: '800', marginBottom: spacing.xs },
  pendingText: { color: colors.warning, fontWeight: '600', lineHeight: 19 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImageWrap: { height: 150, backgroundColor: '#E2DFFF' },
  cardImage: { width: '100%', height: '100%' },
  cardImageFallback: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  cardLine: { color: colors.textMuted, marginTop: spacing.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  cardMeta: { color: colors.text, fontWeight: '600' },
  estado: { color: colors.success, fontWeight: '700', textTransform: 'capitalize' },
});
