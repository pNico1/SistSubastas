import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';
import ScreenHeader from '../components/ScreenHeader';

const p = {
  background:   '#F9F5FF',
  surface:      '#FFFFFF',
  surfaceLow:   '#F2EFFF',
  primary:      '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.10)',
  text:         '#2B2A51',
  muted:        '#585781',
  border:       'rgba(171,169,215,0.35)',
  borderInput:  '#ABA9D7',
  danger:       '#B41340',
  white:        '#FFFFFF',
};

export default function UpgradeSeguroScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [seguro, setSeguro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoValor, setNuevoValor] = useState('');
  const [valorError, setValorError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await productosApi.getSeguros(id);
      setSeguro(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function validar(valor) {
    const n = parseFloat(valor);
    if (!valor || isNaN(n)) return 'Ingresá un valor válido';
    if (seguro?.valorAsegurado != null && n <= seguro.valorAsegurado)
      return `El nuevo valor debe ser mayor al actual (${seguro.valorAsegurado})`;
    return null;
  }

  // Estimación simple de la diferencia de premio a pagar (referencial, hasta tener el cálculo real del backend)
  function calcularDiferencia() {
    const n = parseFloat(nuevoValor);
    if (isNaN(n) || !seguro) return null;
    const diferenciaValor = n - (seguro.valorAsegurado || 0);
    if (diferenciaValor <= 0) return null;
    const tasa = seguro.costoPorUnidad ?? 0.02; // referencial
    return (diferenciaValor * tasa).toFixed(2);
  }

  async function onSubmit() {
    const err = validar(nuevoValor);
    setValorError(err);
    if (err) return;

    const diferencia = calcularDiferencia();
    Alert.alert(
      'Confirmar aumento de cobertura',
      `Vas a pagar la diferencia del premio${diferencia ? ` (aprox. ${seguro.moneda || '$'} ${diferencia})` : ''}. ¿Confirmás?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setSubmitting(true);
            try {
              await productosApi.requestUpgradeSeguro(id, { nuevoValorAsegurado: parseFloat(nuevoValor) });
              Alert.alert('Solicitud enviada', 'La compañía de seguros procesará el aumento de cobertura.', [
                { text: 'Listo', onPress: () => goBackOrReturnTo(navigation, route) },
              ]);
            } catch (e) {
              Alert.alert('No se pudo procesar', e.message || 'Error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) return <Loading text="Cargando póliza..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  if (!seguro) return null;

  const diferencia = calcularDiferencia();

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <ScreenHeader navigation={navigation} route={route} title="Aumentar cobertura" />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Póliza actual */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PÓLIZA ACTUAL</Text>
          <Text style={styles.polizaNumero}>{seguro.numero || '—'}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Valor asegurado</Text>
            <Text style={styles.rowValue}>
              {seguro.moneda || '$'} {seguro.valorAsegurado ?? '—'}
            </Text>
          </View>
        </View>

        {/* Nuevo valor */}
        <Text style={styles.fieldLabel}>NUEVO VALOR ASEGURADO</Text>
        <View style={[styles.inputWrap, valorError && styles.inputWrapError]}>
          <Text style={styles.currencyPrefix}>{seguro.moneda || '$'}</Text>
          <TextInput
            style={styles.input}
            value={nuevoValor}
            onChangeText={(v) => { setNuevoValor(v); setValorError(validar(v)); }}
            placeholder="0.00"
            placeholderTextColor={p.borderInput}
            keyboardType="decimal-pad"
          />
        </View>
        {valorError ? <Text style={styles.fieldError}>{valorError}</Text> : null}

        {diferencia && (
          <View style={styles.diffCard}>
            <MaterialIcons name="info-outline" size={16} color={p.primary} />
            <Text style={styles.diffText}>
              Diferencia estimada del premio a pagar:{' '}
              <Text style={{ fontWeight: '800' }}>{seguro.moneda || '$'} {diferencia}</Text>
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={onSubmit}
          disabled={submitting || !!validar(nuevoValor)}
          activeOpacity={0.88}
          style={{ marginTop: 20 }}
        >
          <LinearGradient
            colors={submitting || !!validar(nuevoValor) ? ['#ABA9D7', '#ABA9D7'] : ['#0846ED', '#859AFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.submitBtn}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Enviando...' : 'Solicitar aumento'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          La solicitud se envía a la compañía de seguros. El aumento de cobertura está sujeto a la diferencia de premio que abones.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: p.surface,
    borderBottomWidth: 1, borderBottomColor: p.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: p.surfaceLow,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: p.text },

  body: { padding: 20 },

  card: {
    backgroundColor: p.surface, borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: p.border, marginBottom: 20,
  },
  cardLabel: { fontSize: 10, fontWeight: '800', color: p.muted, letterSpacing: 1.5, marginBottom: 6 },
  polizaNumero: { fontSize: 18, fontWeight: '900', color: p.text, marginBottom: 12 },
  divider: { height: 1, backgroundColor: p.border, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: p.muted, fontWeight: '600' },
  rowValue: { fontSize: 15, color: p.text, fontWeight: '800' },

  fieldLabel: { fontSize: 11, fontWeight: '800', color: p.text, marginBottom: 8, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: p.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 14,
    shadowColor: p.text, shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  inputWrapError: { borderColor: p.danger },
  currencyPrefix: { fontSize: 16, fontWeight: '800', color: p.muted, marginRight: 6 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: '700', color: p.text },
  fieldError: { color: p.danger, fontSize: 12, fontWeight: '600', marginTop: 6 },

  diffCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: p.primaryFaint, borderRadius: 10,
    padding: 12, marginTop: 14,
  },
  diffText: { flex: 1, fontSize: 13, color: p.text, lineHeight: 18 },

  submitBtn: {
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: p.primary, shadowOpacity: 0.25,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  submitBtnText: { color: p.white, fontWeight: '800', fontSize: 15 },

  disclaimer: { fontSize: 12, color: p.muted, lineHeight: 18, marginTop: 14, textAlign: 'center' },
});
