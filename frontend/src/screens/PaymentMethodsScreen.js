import React, { useCallback, useState } from 'react';
import {
  Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
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
  danger: '#B41340',
  dangerFaint: 'rgba(180,19,64,0.08)',
  success: '#16803A',
  successFaint: '#E7F6EC',
  warning: '#B45309',
  warningFaint: '#FEF3C7',
};

export default function PaymentMethodsScreen({ navigation, route }) {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMetodos((await clienteApi.metodosPago()) || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function eliminar(id) {
    Alert.alert('Eliminar medio de pago', '¿Seguro que querés eliminarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await clienteApi.eliminarMetodoPago(id);
            await load();
          } catch (err) {
            Alert.alert('No se pudo eliminar', err.message || 'Error');
          }
        },
      },
    ]);
  }

  if (loading) return <Loading text="Cargando medios de pago..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBackOrReturnTo(navigation, route)}
          style={styles.backButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de pago</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Tus medios de pago</Text>
        <Text style={styles.subtitle}>
          Para pujar necesitás al menos un medio verificado por la empresa.
        </Text>

        <View style={styles.list}>
          {metodos.map((metodo) => (
            <View key={metodo.id} style={styles.methodCard}>
              <View style={styles.methodIcon}>
                <MaterialIcons name={methodIcon(metodo.tipo)} size={22} color={palette.primary} />
              </View>
              <View style={styles.methodText}>
                <Text style={styles.methodTitle}>{displayTitle(metodo)}</Text>
                <Text style={styles.methodSub}>{displaySubtitle(metodo)}</Text>
                {metodo.moneda ? <Text style={styles.currency}>{metodo.moneda}</Text> : null}
              </View>
              <View style={styles.methodActions}>
                <StatusBadge estado={metodo.estado} />
                <TouchableOpacity
                  onPress={() => eliminar(metodo.id)}
                  style={styles.deleteButton}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={'Eliminar ' + displayTitle(metodo)}
                >
                  <MaterialIcons name="delete-outline" size={19} color={palette.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {metodos.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="account-balance-wallet" size={32} color={palette.primary} />
              </View>
              <Text style={styles.emptyTitle}>Todavía no registraste medios</Text>
              <Text style={styles.emptyText}>
                Agregá una tarjeta, cuenta bancaria o cheque certificado.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => navigation.navigate('PaymentMethod', { from: 'PaymentMethods' })}
            style={styles.addButton}
          >
            <MaterialIcons name="add" size={21} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Agregar medio de pago</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function methodIcon(tipo) {
  if (tipo === 'tarjeta') return 'credit-card';
  if (tipo === 'cuenta_bancaria') return 'account-balance';
  if (tipo === 'cheque') return 'description';
  return 'payments';
}

function StatusBadge({ estado }) {
  const verified = estado === 'verified' || estado === 'verificado';
  return (
    <View style={[styles.statusBadge, verified ? styles.statusVerified : styles.statusPending]}>
      <MaterialIcons
        name={verified ? 'verified' : 'schedule'}
        size={13}
        color={verified ? palette.success : palette.warning}
      />
      <Text style={[styles.statusText, { color: verified ? palette.success : palette.warning }]}>
        {verified ? 'Verificado' : 'Pendiente'}
      </Text>
    </View>
  );
}

function displayTitle(metodo) {
  if (metodo.tipo === 'tarjeta') return metodo.marca || 'Tarjeta';
  if (metodo.tipo === 'cuenta_bancaria') return 'Cuenta bancaria';
  if (metodo.tipo === 'cheque') return 'Cheque certificado';
  return metodo.tipo || 'Medio de pago';
}

function displaySubtitle(metodo) {
  if (metodo.ultimos4) return '•••• ' + metodo.ultimos4;
  if (metodo.cbu) return 'CBU terminado en ' + metodo.cbu.slice(-6);
  if (metodo.banco) return metodo.banco;
  return metodo.titular || 'Sin detalle';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: palette.surface,
    borderBottomWidth: 1, borderBottomColor: palette.border,
  },
  headerTitle: { color: palette.text, fontSize: 16, fontWeight: '800' },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: palette.surfaceLow,
    alignItems: 'center', justifyContent: 'center',
  },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 32 },
  title: { color: palette.text, fontSize: 25, lineHeight: 31, fontWeight: '900' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  list: { gap: 12 },
  methodCard: {
    minHeight: 96, borderRadius: 16, backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.border, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  methodIcon: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: palette.primaryFaint,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  methodText: { flex: 1, minWidth: 0 },
  methodTitle: { color: palette.text, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  methodSub: { color: palette.muted, fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 3 },
  currency: { color: palette.primary, fontSize: 10, fontWeight: '900', marginTop: 5 },
  methodActions: {
    alignItems: 'flex-end', justifyContent: 'space-between',
    alignSelf: 'stretch', marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999,
  },
  statusVerified: { backgroundColor: palette.successFaint },
  statusPending: { backgroundColor: palette.warningFaint },
  statusText: { fontSize: 10, fontWeight: '800' },
  deleteButton: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: palette.dangerFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  emptyIcon: {
    width: 66, height: 66, borderRadius: 33, backgroundColor: palette.primaryFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: palette.text, fontSize: 17, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  emptyText: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  addButton: {
    minHeight: 52, borderRadius: 14, backgroundColor: palette.primary,
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 6,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
