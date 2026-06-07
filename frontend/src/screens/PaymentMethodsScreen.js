import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';

const palette = {
  background: '#F9F5FF',
  surface: '#FFFFFF',
  field: '#F5F2FF',
  primary: '#2357FF',
  text: '#2B2A51',
  muted: '#8B88A8',
  border: '#DCD7F4',
  danger: '#FF748D',
};

export default function PaymentMethodsScreen({ navigation }) {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await clienteApi.metodosPago();
      setMetodos(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  function eliminar(id) {
    Alert.alert('Eliminar medio de pago', 'Seguro que queres eliminarlo?', [
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
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Agregar medio{'\n'}de pago</Text>

        <View style={styles.list}>
          {metodos.map((metodo) => (
            <TouchableOpacity
              key={metodo.id}
              activeOpacity={0.86}
              onLongPress={() => eliminar(metodo.id)}
              style={styles.methodCard}
            >
              <View style={styles.methodText}>
                <Text style={styles.methodTitle}>{displayTitle(metodo)}</Text>
                <Text style={styles.methodSub}>{displaySubtitle(metodo)}</Text>
              </View>
              <Text style={styles.state}>{metodo.estado === 'verified' ? 'OK' : 'PEND'}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => navigation.navigate('PaymentMethod', { from: 'PaymentMethods' })}
            style={styles.addCard}
          >
            <View style={styles.plusCircle}>
              <Text style={styles.plus}>+</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function displayTitle(metodo) {
  if (metodo.tipo === 'tarjeta') return metodo.marca || 'Tarjeta';
  if (metodo.tipo === 'cuenta_bancaria') return 'Cuenta Bancaria';
  if (metodo.tipo === 'cheque') return 'Cheque Certificado';
  return metodo.tipo || 'Metodo de pago';
}

function displaySubtitle(metodo) {
  if (metodo.ultimos4) return `***${metodo.ultimos4}`;
  if (metodo.cbu) return `CBU ${metodo.cbu.slice(-6)}`;
  if (metodo.banco) return metodo.banco;
  return metodo.estado === 'verified' ? 'Verificado' : 'Pendiente';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 28,
  },
  backButton: {
    width: 42,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  backArrow: {
    color: palette.text,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
  },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 22,
  },
  list: { gap: 14 },
  methodCard: {
    minHeight: 82,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: { flex: 1, minWidth: 0 },
  methodTitle: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  methodSub: {
    color: palette.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    marginTop: 8,
  },
  state: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 10,
  },
  addCard: {
    height: 72,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: palette.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    color: palette.text,
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '300',
  },
});
