import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { subastasApi } from '../api/endpoints';
import { POLLING_MS } from '../config';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';

const p = {
  background:   '#F9F5FF',
  surface:      '#FFFFFF',
  surfaceLow:   '#F2EFFF',
  container:    '#E9E5FF',
  primary:      '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.08)',
  text:         '#2B2A51',
  muted:        '#585781',
  border:       'rgba(171,169,215,0.35)',
  borderInput:  '#ABA9D7',
  success:      '#16A34A',
  successFaint: '#E7F6EC',
  warning:      '#D97706',
  warningFaint: '#FEF3C7',
  danger:       '#B41340',
  white:        '#FFFFFF',
};

export default function ItemDetailScreen({ route }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { subastaId, itemId, nombre, joined } = route.params;
  const [oferta, setOferta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importe, setImporte] = useState('');
  const [importeError, setImporteError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const importeTocado = useRef(false);
  const pendingVerification = user?.estado === 'pending_verification';

  const fetchOferta = useCallback(async () => {
    if (pendingVerification) return;
    try {
      const data = await subastasApi.getOfertaActual(subastaId, itemId);
      setOferta(data);
      setError(null);
      if (!importeTocado.current && data.proximaPujaMinima != null) {
        setImporte(String(data.proximaPujaMinima));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [subastaId, itemId, pendingVerification]);

  useEffect(() => {
    if (pendingVerification) return undefined;
    fetchOferta();
    const t = setInterval(fetchOferta, POLLING_MS);
    return () => clearInterval(t);
  }, [fetchOferta, pendingVerification]);

  function validar(valor) {
    const n = parseFloat(valor);
    if (!valor || isNaN(n)) return 'Ingresá un importe válido';
    if (oferta?.proximaPujaMinima != null && n < oferta.proximaPujaMinima)
      return `La puja mínima es ${oferta.proximaPujaMinima}`;
    if (oferta?.proximaPujaMaxima != null && n > oferta.proximaPujaMaxima)
      return `La puja máxima es ${oferta.proximaPujaMaxima}`;
    return null;
  }

  async function onPujar() {
    const err = validar(importe);
    setImporteError(err);
    if (err) return;
    setSubmitting(true);
    try {
      await subastasApi.pujar(subastaId, itemId, parseFloat(importe));
      Alert.alert('Puja realizada', `Ofertaste ${importe}. Quedás como mejor postor.`);
      importeTocado.current = false;
      await fetchOferta();
    } catch (e) {
      Alert.alert('No se pudo pujar', e.message || 'Error al registrar la puja');
      await fetchOferta();
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingVerification) {
    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedTitle}>Cuenta en verificación</Text>
        <Text style={styles.blockedText}>
          Tu cuenta todavía está pendiente de aprobación. No podés pujar hasta que sea verificada.
        </Text>
      </View>
    );
  }

  if (loading) return <Loading text="Cargando lote..." />;
  if (error && !oferta) return <ErrorView error={error} onRetry={() => { setLoading(true); fetchOferta(); }} />;

  const tieneOferta = oferta.ofertaActual != null;

  return (
    <ScrollView
      style={{ backgroundColor: p.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
    >
      {/* Header editorial */}
      <View style={styles.editorialHeader}>
        <View style={styles.lotBadge}>
          <Text style={styles.lotBadgeText}>LOT #{itemId}</Text>
        </View>
        <Text style={styles.title}>{nombre || `Item ${itemId}`}</Text>
      </View>

      {/* Precio base */}
      <View style={styles.baseCard}>
        <Text style={styles.baseLabel}>PRECIO BASE</Text>
        <Text style={styles.baseValue}>{oferta.precioBase}</Text>
      </View>

      {/* Oferta actual — carta principal */}
      <View style={styles.ofertaCard}>
        <View style={styles.ofertaTop}>
          <Text style={styles.ofertaLabel}>OFERTA ACTUAL</Text>
          <View style={[styles.liveDot, tieneOferta && { backgroundColor: p.success }]} />
        </View>

        {tieneOferta ? (
          <>
            <Text style={styles.ofertaValor}>{oferta.ofertaActual}</Text>
            <View style={styles.postorRow}>
              <MaterialIcons name="person" size={14} color={p.muted} />
              <Text style={styles.postorText}>Mejor postor N° {oferta.numeroPostorActual}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.sinOferta}>¡Sé el primero en ofertar!</Text>
        )}

        {/* Rango */}
        <View style={styles.rangoRow}>
          <View style={styles.rangoBox}>
            <Text style={styles.rangoLabel}>MÍN</Text>
            <Text style={styles.rangoValor}>{oferta.proximaPujaMinima}</Text>
          </View>
          <View style={[styles.rangoBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.rangoLabel}>MÁX</Text>
            <Text style={styles.rangoValor}>
              {oferta.proximaPujaMaxima != null ? oferta.proximaPujaMaxima : '∞'}
            </Text>
          </View>
        </View>
      </View>

      {/* Polling hint */}
      <View style={styles.liveHint}>
        <MaterialIcons name="sync" size={13} color={p.muted} />
        <Text style={styles.liveHintText}>La oferta se actualiza automáticamente</Text>
      </View>

      {/* Formulario de puja o aviso */}
      {!joined ? (
        <View style={styles.aviso}>
          <MaterialIcons name="info-outline" size={18} color={p.warning} />
          <Text style={styles.avisoText}>
            Debés unirte a la subasta para poder pujar.
          </Text>
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Tu puja</Text>

          <View style={[styles.inputWrap, importeError && styles.inputWrapError]}>
            <TextInput
              style={styles.input}
              value={importe}
              onChangeText={(v) => {
                importeTocado.current = true;
                setImporte(v);
                setImporteError(validar(v));
              }}
              keyboardType="numeric"
              placeholder="Importe a ofertar"
              placeholderTextColor={p.borderInput}
            />
          </View>
          {importeError ? <Text style={styles.inputError}>{importeError}</Text> : null}

          <TouchableOpacity
            onPress={onPujar}
            disabled={submitting || !!validar(importe)}
            activeOpacity={0.88}
            style={{ marginTop: 16 }}
          >
            <LinearGradient
              colors={
                submitting || !!validar(importe)
                  ? ['#ABA9D7', '#ABA9D7']
                  : ['#0846ED', '#859AFF']
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.pujarBtn}
            >
              <Text style={styles.pujarBtnText}>
                {submitting ? 'Enviando...' : 'Pujar'}
              </Text>
              {!submitting && (
                <MaterialIcons name="gavel" size={18} color={p.white} style={{ marginLeft: 8 }} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  blocked: { flex: 1, backgroundColor: p.background, padding: 24, alignItems: 'center', justifyContent: 'center' },
  blockedTitle: { color: p.text, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  blockedText: { color: p.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },

  container: { padding: 20 },

  // Header
  editorialHeader: { marginBottom: 20 },
  lotBadge: {
    alignSelf: 'flex-start',
    backgroundColor: p.surface,
    borderWidth: 1, borderColor: p.border,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    marginBottom: 10,
  },
  lotBadgeText: { fontSize: 11, fontWeight: '800', color: p.text, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: p.text, lineHeight: 32, letterSpacing: -0.3 },

  // Base
  baseCard: {
    backgroundColor: p.surface, borderRadius: 14,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: p.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  baseLabel: { fontSize: 10, fontWeight: '800', color: p.muted, letterSpacing: 1.5 },
  baseValue: { fontSize: 18, fontWeight: '800', color: p.text },

  // Oferta card
  ofertaCard: {
    backgroundColor: p.surface, borderRadius: 16,
    padding: 20, marginBottom: 8,
    borderWidth: 1, borderColor: p.border,
  },
  ofertaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ofertaLabel: { fontSize: 10, fontWeight: '800', color: p.muted, letterSpacing: 1.5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: p.border },
  ofertaValor: { fontSize: 40, fontWeight: '900', color: p.primary, letterSpacing: -1, marginBottom: 4 },
  postorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  postorText: { fontSize: 13, color: p.muted, fontWeight: '600' },
  sinOferta: { fontSize: 15, color: p.warning, fontWeight: '700', marginBottom: 16 },
  rangoRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: p.surfaceLow, borderRadius: 10, padding: 12 },
  rangoBox: { flex: 1 },
  rangoLabel: { fontSize: 9, fontWeight: '800', color: p.muted, letterSpacing: 1.5, marginBottom: 2 },
  rangoValor: { fontSize: 15, fontWeight: '800', color: p.text },

  // Live hint
  liveHint: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 20 },
  liveHintText: { fontSize: 12, color: p.muted, fontWeight: '600' },

  // Aviso
  aviso: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: p.warningFaint, borderRadius: 12, padding: 14,
  },
  avisoText: { flex: 1, color: p.warning, fontWeight: '600', fontSize: 14 },

  // Formulario
  formCard: {
    backgroundColor: p.surface, borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: p.border,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: p.text, marginBottom: 12 },
  inputWrap: {
    backgroundColor: p.surfaceLow, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  inputWrapError: { borderColor: p.danger },
  input: { fontSize: 18, fontWeight: '700', color: p.text },
  inputError: { color: p.danger, fontSize: 12, fontWeight: '600', marginTop: 6 },
  pujarBtn: {
    height: 54, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: p.primary, shadowOpacity: 0.25,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  pujarBtnText: { color: p.white, fontSize: 16, fontWeight: '800' },
});