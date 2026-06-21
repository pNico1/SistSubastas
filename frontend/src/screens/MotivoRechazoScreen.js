import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  text:         '#2B2A51',
  muted:        '#585781',
  border:       'rgba(171,169,215,0.35)',
  danger:       '#B41340',
  dangerFaint:  'rgba(180,19,64,0.08)',
  white:        '#FFFFFF',
};

export default function MotivoRechazoScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NOTA: endpoint pendiente en backend -> GET /api/clientes/me/productos/{id}/rejectMotive
  // Se asume que devuelve: { motivo, fecha, costoDevolucion, moneda }
  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await productosApi.getRejectMotive(id);
      setData(result);
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

  if (loading) return <Loading text="Cargando motivo..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  if (!data) return null;

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
        <Text style={styles.headerTitle}>Motivo de rechazo</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="cancel" size={36} color={p.danger} />
        </View>

        <Text style={styles.title}>Tu bien no fue aceptado</Text>
        {data.fecha && <Text style={styles.fecha}>Revisado el {data.fecha}</Text>}

        <View style={styles.motivoCard}>
          <Text style={styles.motivoLabel}>MOTIVO</Text>
          <Text style={styles.motivoText}>{data.motivo || 'No se especificó un motivo.'}</Text>
        </View>

        {data.costoDevolucion != null && (
          <View style={styles.devolucionCard}>
            <MaterialIcons name="local-shipping" size={18} color={p.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.devolucionTitle}>Devolución con cargo</Text>
              <Text style={styles.devolucionText}>
                El bien será devuelto a tu domicilio. Costo de envío:{' '}
                <Text style={{ fontWeight: '800' }}>
                  {data.moneda || '$'} {data.costoDevolucion}
                </Text>
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => goBackOrReturnTo(navigation, route)}
          activeOpacity={0.85}
        >
          <Text style={styles.closeBtnText}>Cerrar</Text>
        </TouchableOpacity>
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

  body: { padding: 24, alignItems: 'center' },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: p.dangerFaint,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 16, marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: p.text, textAlign: 'center' },
  fecha: { fontSize: 13, color: p.muted, marginTop: 4, marginBottom: 20 },

  motivoCard: {
    width: '100%',
    backgroundColor: p.surface, borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: p.border,
    marginBottom: 16,
  },
  motivoLabel: { fontSize: 10, fontWeight: '800', color: p.muted, letterSpacing: 1.5, marginBottom: 8 },
  motivoText: { fontSize: 15, color: p.text, lineHeight: 22 },

  devolucionCard: {
    width: '100%', flexDirection: 'row', gap: 10,
    backgroundColor: p.surfaceLow, borderRadius: 12,
    padding: 14, marginBottom: 24,
  },
  devolucionTitle: { fontSize: 13, fontWeight: '800', color: p.text, marginBottom: 4 },
  devolucionText: { fontSize: 13, color: p.muted, lineHeight: 19 },

  closeBtn: {
    width: '100%', height: 52, borderRadius: 12,
    backgroundColor: p.surface, borderWidth: 1.5, borderColor: p.border,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontWeight: '800', color: p.text, fontSize: 15 },
});