import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi, multasApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import ScreenHeader from '../components/ScreenHeader';

const p = {
  background: '#F9F5FF',
  surface: '#FFF',
  surfaceLow: '#F2EFFF',
  primary: '#0846ED',
  text: '#2B2A51',
  muted: '#585781',
  border: 'rgba(171,169,215,.35)',
  danger: '#B41340',
  dangerFaint: 'rgba(180,19,64,.08)',
  success: '#16803A',
  successFaint: '#E7F6EC',
};

export default function MultaDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [multa, setMulta] = useState(null);
  const [medios, setMedios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, ms] = await Promise.all([multasApi.getById(id), clienteApi.metodosPago()]);
      const validos = (ms || []).filter((x) => x.estado === 'verified');
      setMulta(m);
      setMedios(validos);
      if (validos.length === 1) setSelected(validos[0].id);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function pagar() {
    if (!selected) return Alert.alert('Elegí un medio de pago');
    setPaying(true);
    try {
      await multasApi.pagar(id, selected);
      Alert.alert('Multa pagada', 'El pago fue confirmado.', [
        { text: 'OK', onPress: () => navigation.navigate('Notificaciones') },
      ]);
    } catch (e) {
      Alert.alert('No se pudo pagar', e?.response?.data?.message || e.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <Loading text="Cargando multa..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  const pagada = multa.estado === 'paid';

  return (
    <View style={styles.screen}>
      <ScreenHeader navigation={navigation} route={route} title="Detalle de multa" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.icon, pagada && { backgroundColor: p.successFaint }]}>
          <MaterialIcons name={pagada ? 'check-circle' : 'gavel'} size={36} color={pagada ? p.success : p.danger} />
        </View>
        <Text style={styles.title}>{pagada ? 'Multa pagada' : 'Multa pendiente'}</Text>
        <Text style={styles.amount}>ARS {Number(multa.importe || 0).toLocaleString('es-AR')}</Text>
        <Text style={styles.text}>
          {pagada
            ? 'Tu obligación fue regularizada.'
            : `Debés abonarla antes de volver a participar. Fecha límite: ${multa.fechaLimite || 'a confirmar'}.`}
        </Text>

        {!pagada && (
          <>
            <Text style={styles.section}>Medio de pago</Text>
            {medios.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.method, selected === m.id && styles.selected]}
                onPress={() => setSelected(m.id)}
              >
                <MaterialIcons name={m.tipo === 'tarjeta' ? 'credit-card' : 'account-balance'} size={21} color={p.primary} />
                <Text style={styles.methodText}>
                  {m.marca || m.banco || m.tipo} ····{m.ultimos4 || (m.cbu || '').slice(-4)}
                </Text>
                <MaterialIcons
                  name={selected === m.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={21}
                  color={selected === m.id ? p.primary : p.muted}
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.button, (!selected || paying) && { opacity: 0.55 }]}
              disabled={!selected || paying}
              onPress={pagar}
            >
              <Text style={styles.buttonText}>{paying ? 'Procesando...' : 'Pagar multa'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.background },
  body: { padding: 22, alignItems: 'center' },
  icon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: p.dangerFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: p.text, fontSize: 23, fontWeight: '900', marginTop: 14 },
  amount: { color: p.danger, fontSize: 29, fontWeight: '900', marginTop: 8 },
  text: {
    color: p.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  section: {
    width: '100%',
    color: p.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 24,
    marginBottom: 10,
  },
  method: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: p.surface,
    borderWidth: 1.5,
    borderColor: p.border,
    borderRadius: 13,
    padding: 14,
    marginBottom: 9,
  },
  selected: { borderColor: p.primary },
  methodText: { flex: 1, color: p.text, fontSize: 13, fontWeight: '700' },
  button: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.primary,
    borderRadius: 14,
    marginTop: 14,
  },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
