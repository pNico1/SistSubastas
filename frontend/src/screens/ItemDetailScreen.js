import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { subastasApi } from '../api/endpoints';
import { POLLING_MS } from '../config';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { colors, radius, spacing } from '../theme';

export default function ItemDetailScreen({ route }) {
  const { subastaId, itemId, nombre, joined } = route.params;
  const [oferta, setOferta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importe, setImporte] = useState('');
  const [importeError, setImporteError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const importeTocado = useRef(false);

  const fetchOferta = useCallback(async () => {
    try {
      const data = await subastasApi.getOfertaActual(subastaId, itemId);
      setOferta(data);
      setError(null);
      // prellenar el importe con la proxima puja minima (hasta que el usuario edite)
      if (!importeTocado.current && data.proximaPujaMinima != null) {
        setImporte(String(data.proximaPujaMinima));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [subastaId, itemId]);

  // Polling: refresca la oferta actual cada POLLING_MS (tiempo real simplificado).
  useEffect(() => {
    fetchOferta();
    const t = setInterval(fetchOferta, POLLING_MS);
    return () => clearInterval(t);
  }, [fetchOferta]);

  function validar(valor) {
    const n = parseFloat(valor);
    if (!valor || isNaN(n)) return 'Ingresa un importe valido';
    if (oferta?.proximaPujaMinima != null && n < oferta.proximaPujaMinima)
      return `La puja minima es ${oferta.proximaPujaMinima}`;
    if (oferta?.proximaPujaMaxima != null && n > oferta.proximaPujaMaxima)
      return `La puja maxima es ${oferta.proximaPujaMaxima}`;
    return null;
  }

  async function onPujar() {
    const err = validar(importe);
    setImporteError(err);
    if (err) return;

    setSubmitting(true); // no se permite otra puja hasta confirmar (regla del TP)
    try {
      await subastasApi.pujar(subastaId, itemId, parseFloat(importe));
      Alert.alert('Puja realizada', `Ofertaste ${importe}. Quedas como mejor postor.`);
      importeTocado.current = false;
      await fetchOferta();
    } catch (e) {
      Alert.alert('No se pudo pujar', e.message || 'Error al registrar la puja');
      await fetchOferta(); // reflejar el estado real luego del rechazo
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading text="Cargando item..." />;
  if (error && !oferta) return <ErrorView error={error} onRetry={() => { setLoading(true); fetchOferta(); }} />;

  const tieneOferta = oferta.ofertaActual != null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{nombre || `Item ${itemId}`}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Precio base</Text>
        <Text style={styles.base}>{oferta.precioBase}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Oferta actual</Text>
        {tieneOferta ? (
          <>
            <Text style={styles.oferta}>{oferta.ofertaActual}</Text>
            <Text style={styles.postor}>Mejor postor: N° {oferta.numeroPostorActual}</Text>
          </>
        ) : (
          <Text style={styles.sinOferta}>Aun no hay ofertas. ¡Se el primero!</Text>
        )}
      </View>

      <View style={styles.rango}>
        <Text style={styles.rangoText}>Puja minima: {oferta.proximaPujaMinima}</Text>
        <Text style={styles.rangoText}>
          Puja maxima: {oferta.proximaPujaMaxima != null ? oferta.proximaPujaMaxima : 'sin limite'}
        </Text>
      </View>

      {!joined ? (
        <View style={styles.aviso}>
          <Text style={styles.avisoText}>
            Debes unirte a la subasta para poder pujar.
          </Text>
        </View>
      ) : (
        <View style={styles.form}>
          <TextField
            label="Tu puja"
            value={importe}
            onChangeText={(v) => { importeTocado.current = true; setImporte(v); setImporteError(validar(v)); }}
            keyboardType="numeric"
            placeholder="Importe a ofertar"
            error={importeError}
          />
          <Button
            title={submitting ? 'Enviando...' : 'Pujar'}
            onPress={onPujar}
            loading={submitting}
            disabled={!!validar(importe)}
            variant="accent"
          />
          <Text style={styles.liveHint}>🔄 La oferta se actualiza automaticamente cada pocos segundos.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.textMuted, fontWeight: '600' },
  base: { fontSize: 20, color: colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  oferta: { fontSize: 34, fontWeight: '800', color: colors.primary, marginTop: 2 },
  postor: { color: colors.textMuted, marginTop: spacing.xs },
  sinOferta: { color: colors.warning, fontWeight: '600', marginTop: spacing.xs },
  rango: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingHorizontal: spacing.xs },
  rangoText: { color: colors.textMuted, fontSize: 13 },
  form: { marginTop: spacing.lg, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  liveHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.md },
  aviso: { marginTop: spacing.lg, backgroundColor: '#FEF3C7', padding: spacing.md, borderRadius: radius.md },
  avisoText: { color: colors.warning, textAlign: 'center', fontWeight: '600' },
});
