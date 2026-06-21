import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
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
  danger:       '#B41340',
  white:        '#FFFFFF',
};

export default function AceptarTerminosScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await productosApi.getById(id);
      setProducto(data);
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

  async function decidir(aceptados) {
    const confirmText = aceptados
      ? '¿Confirmás el valor base y las comisiones de este bien?'
      : 'Si no aceptás, el bien será devuelto y se te informarán los gastos. ¿Confirmás?';

    Alert.alert(
      aceptados ? 'Confirmar aceptación' : 'Confirmar rechazo',
      confirmText,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Confirmar',
          style: aceptados ? 'default' : 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await productosApi.updateTerminos(id, aceptados);
              Alert.alert(
                aceptados ? 'Términos aceptados' : 'Términos rechazados',
                aceptados
                  ? 'Tu bien va a incluirse en la subasta indicada.'
                  : 'Vas a recibir el detalle de la devolución.',
                [{ text: 'Listo', onPress: () => goBackOrReturnTo(navigation, route) }]
              );
            } catch (err) {
              Alert.alert('No se pudo procesar', err.message || 'Error');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }

  if (loading) return <Loading text="Cargando términos..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  if (!producto) return null;

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => goBackOrReturnTo(navigation, route)}
          style={styles.backBtn}
          hitSlop={10}
        >
          <MaterialIcons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Condiciones de subasta</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.pieza} numberOfLines={2}>
          {producto.descripcionCatalogo || `Producto #${producto.id}`}
        </Text>
        <Text style={styles.subtitle}>
          La empresa aceptó tu bien y propone las siguientes condiciones para incluirlo en una subasta.
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Precio base</Text>
            <Text style={styles.rowValue}>
              {producto.moneda || '$'} {producto.precioBase ?? '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Comisión</Text>
            <Text style={styles.rowValue}>
              {producto.comision != null ? `${producto.comision}%` : '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Subasta</Text>
            <Text style={styles.rowValue}>
              {producto.subastaId ? `#${producto.subastaId}` : 'A confirmar'}
            </Text>
          </View>
          {producto.subastaFecha && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fecha</Text>
                <Text style={styles.rowValue}>{producto.subastaFecha} {producto.subastaHora}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.disclaimer}>
          Si no aceptás el valor base o las comisiones, el bien se devolverá y se te informarán los gastos correspondientes.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => decidir(false)}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.rejectBtnText}>No acepto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => decidir(true)}
            disabled={submitting}
            activeOpacity={0.88}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={submitting ? ['#ABA9D7', '#ABA9D7'] : ['#0846ED', '#859AFF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.acceptBtn}
            >
              <Text style={styles.acceptBtnText}>
                {submitting ? 'Procesando...' : 'Acepto'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  pieza: { fontSize: 22, fontWeight: '900', color: p.text, lineHeight: 27, marginBottom: 8 },
  subtitle: { fontSize: 14, color: p.muted, lineHeight: 20, marginBottom: 20 },

  card: {
    backgroundColor: p.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: p.border, marginBottom: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: p.muted },
  rowValue: { fontSize: 15, fontWeight: '800', color: p.text },
  divider: { height: 1, backgroundColor: p.border },

  disclaimer: { fontSize: 12, color: p.muted, lineHeight: 18, marginBottom: 24, textAlign: 'center' },

  actions: { flexDirection: 'row', gap: 12 },
  rejectBtn: {
    flex: 1, height: 54, borderRadius: 14,
    borderWidth: 1.5, borderColor: p.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  rejectBtnText: { color: p.danger, fontWeight: '800', fontSize: 15 },
  acceptBtn: {
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: p.primary, shadowOpacity: 0.25,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  acceptBtnText: { color: p.white, fontWeight: '800', fontSize: 15 },
});