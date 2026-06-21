import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { productosApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo, navigateWithReturnTo } from '../navigationUtils';

const p = {
  background:   '#F9F5FF',
  surface:      '#FFFFFF',
  surfaceLow:   '#F2EFFF',
  container:    '#E9E5FF',
  primary:      '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.10)',
  text:         '#2B2A51',
  muted:        '#585781',
  border:       'rgba(171,169,215,0.35)',
  success:      '#16A34A',
  successFaint: '#E7F6EC',
  danger:       '#B41340',
  dangerFaint:  'rgba(180,19,64,0.08)',
  warning:      '#D97706',
  warningFaint: '#FEF3C7',
  white:        '#FFFFFF',
};

const ESTADO_CONFIG = {
  en_revision: { label: 'En revisión', icon: 'hourglass-top', color: p.warning, bg: p.warningFaint },
  aceptado: { label: 'Aceptado', icon: 'check-circle', color: p.success, bg: p.successFaint },
  aprobado: { label: 'Aceptado', icon: 'check-circle', color: p.success, bg: p.successFaint },
  rechazado: { label: 'Rechazado', icon: 'cancel', color: p.danger, bg: p.dangerFaint },
  en_subasta: { label: 'En subasta', icon: 'gavel', color: p.primary, bg: p.primaryFaint },
  vendido: { label: 'Vendido', icon: 'sell', color: p.success, bg: p.successFaint },
  pendiente_terminos: { label: 'Esperando tu confirmación', icon: 'info', color: p.warning, bg: p.warningFaint },
  en_devolucion: { label: 'En devolución', icon: 'local-shipping', color: p.muted, bg: p.surfaceLow },
  DEFAULT: { label: 'Sin estado', icon: 'help-outline', color: p.muted, bg: p.surfaceLow },
};

function getEstadoConfig(estado) {
  return ESTADO_CONFIG[estado] || ESTADO_CONFIG.DEFAULT;
}

function Section({ title, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name={icon} size={18} color={p.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProductoDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [producto, setProducto] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await productosApi.getById(id);
      setProducto(data);
      setFotos(data?.fotos || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <Loading text="Cargando producto..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;
  if (!producto) return null;

  const config = getEstadoConfig(producto.estado);

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => goBackOrReturnTo(navigation, route)}
          style={styles.backBtn}
          hitSlop={10}
        >
          <MaterialIcons name="arrow-back" size={22} color={p.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {producto.descripcionCatalogo || `Producto #${producto.id}`}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
      >
        {/* Galería de fotos */}
        {fotos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {fotos.map((foto, i) => (
              <Image
                key={i}
                source={{ uri: foto.startsWith('http') || foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}` }}
                style={styles.galleryImg}
              />
            ))}
          </ScrollView>
        ) : (
          <LinearGradient colors={['#0846ED', '#859AFF']} style={styles.galleryPlaceholder}>
            <MaterialIcons name="image" size={40} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        )}

        <View style={styles.body}>
          {/* Estado actual */}
          <View style={[styles.estadoBanner, { backgroundColor: config.bg }]}>
            <MaterialIcons name={config.icon} size={20} color={config.color} />
            <Text style={[styles.estadoBannerText, { color: config.color }]}>{config.label}</Text>
          </View>

          {/* Acciones según estado */}
          {producto.estado === 'rechazado' && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigateWithReturnTo(navigation, 'MotivoRechazo', { id: producto.id })}
            >
              <MaterialIcons name="report" size={18} color={p.danger} />
              <Text style={[styles.actionText, { color: p.danger }]}>Ver motivo de rechazo</Text>
              <MaterialIcons name="chevron-right" size={20} color={p.muted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {(producto.estado === 'pendiente_terminos' || producto.estado === 'aprobado') && (
            <TouchableOpacity
              style={[styles.actionRow, { backgroundColor: p.primaryFaint, borderColor: 'rgba(8,70,237,0.2)' }]}
              onPress={() => navigateWithReturnTo(navigation, 'AceptarTerminos', { id: producto.id })}
            >
              <MaterialIcons name="fact-check" size={18} color={p.primary} />
              <Text style={[styles.actionText, { color: p.primary }]}>Revisar valor base y comisiones</Text>
              <MaterialIcons name="chevron-right" size={20} color={p.primary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {(producto.estado === 'en_devolucion' || producto.estado === 'devuelto') && (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigateWithReturnTo(navigation, 'Devolucion', { id: producto.id })}
            >
              <MaterialIcons name="local-shipping" size={18} color={p.muted} />
              <Text style={styles.actionText}>Seguir devolución</Text>
              <MaterialIcons name="chevron-right" size={20} color={p.muted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {/* Datos básicos */}
          <Section title="Información del bien" icon="description">
            <InfoRow label="Descripción" value={producto.descripcionCompleta} />
            <InfoRow label="Artista / autor" value={producto.nombreArtista} />
            <InfoRow label="Fecha de la obra" value={producto.fechaObra} />
            <InfoRow label="Historia" value={producto.historia} />
            <InfoRow
              label="Precio base"
              value={producto.precioBase != null ? `${producto.moneda || '$'} ${producto.precioBase}` : null}
            />
          </Section>

          {/* Ubicación / depósito — solo si ya fue aceptado */}
          {(producto.estado === 'en_subasta' || producto.estado === 'aceptado' || producto.estado === 'aprobado' || producto.estado === 'vendido') && (
            <Section title="Ubicación de la pieza" icon="location-on">
              <InfoRow label="Depósito" value={producto.deposito || 'A confirmar'} />
            </Section>
          )}

          {/* Subasta asignada */}
          {producto.subastaId && (
            <Section title="Subasta asignada" icon="event">
              <InfoRow label="Subasta" value={`#${producto.subastaId}`} />
              <InfoRow label="Fecha" value={producto.subastaFecha} />
              <InfoRow label="Hora" value={producto.subastaHora} />
              <InfoRow label="Comisión" value={producto.comision != null ? `${producto.comision}%` : null} />
            </Section>
          )}

          {/* Seguro */}
          {producto.poliza && (
            <Section title="Póliza de seguro" icon="verified-user">
              <InfoRow label="N° de póliza" value={producto.poliza.numero} />
              <InfoRow label="Cobertura" value={producto.poliza.cobertura} />
              <TouchableOpacity
                style={styles.upgradeLink}
                onPress={() => navigateWithReturnTo(navigation, 'UpgradeSeguro', { id: producto.id })}
              >
                <Text style={styles.upgradeLinkText}>Aumentar cobertura</Text>
                <MaterialIcons name="arrow-forward" size={14} color={p.primary} />
              </TouchableOpacity>
            </Section>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, gap: 12,
    backgroundColor: p.surface,
    borderBottomWidth: 1, borderBottomColor: p.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: p.surfaceLow,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: p.text, textAlign: 'center' },

  gallery: { backgroundColor: p.surface },
  galleryImg: { width: 280, height: 200 },
  galleryPlaceholder: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },

  body: { padding: 16 },

  estadoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, padding: 14, marginBottom: 12,
  },
  estadoBannerText: { fontWeight: '800', fontSize: 14 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: p.surface, borderWidth: 1, borderColor: p.border,
    borderRadius: 12, padding: 14, marginBottom: 12,
  },
  actionText: { fontWeight: '700', fontSize: 14, color: p.text },

  section: {
    backgroundColor: p.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: p.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: p.text },

  infoRow: { marginBottom: 8 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: p.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: p.text, marginTop: 2, lineHeight: 20 },

  upgradeLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  upgradeLinkText: { color: p.primary, fontWeight: '700', fontSize: 13 },
});
