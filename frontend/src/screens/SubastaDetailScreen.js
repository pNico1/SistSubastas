import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { subastasApi, clienteApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import Button from '../components/Button';
import { navigateWithReturnTo } from '../navigationUtils';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.82;
const CARD_H = CARD_W * 0.62;

const p = {
  background:          '#F9F5FF',
  surface:             '#FFFFFF',
  surfaceLow:          '#F2EFFF',
  container:           '#E9E5FF',
  primary:             '#0846ED',
  primaryFaint:        'rgba(8,70,237,0.10)',
  tertiary:            '#913983',
  tertiaryContainer:   '#F790E0',
  onTertiaryContainer: '#5F0656',
  text:                '#2B2A51',
  muted:               '#585781',
  border:              'rgba(171,169,215,0.35)',
  success:             '#16A34A',
  successFaint:        '#E7F6EC',
  danger:              '#B41340',
  white:               '#FFFFFF',
};

// Paleta de colores para placeholder cuando no hay imagen
const PLACEHOLDER_GRADIENTS = [
  ['#0846ED', '#859AFF'],
  ['#913983', '#F790E0'],
  ['#2B2A51', '#585781'],
  ['#003CD3', '#0846ED'],
  ['#6A1460', '#913983'],
];

const PLACEHOLDER_ICONS = ['gavel', 'diamond', 'star', 'auto-awesome', 'workspace-premium'];

function LotCard({ item, index, subasta, joined, onPress }) {
  const gradientColors = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
  const iconName = PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length];
  const vendido = item.subastado === 'si';

  return (
    <TouchableOpacity
      style={[styles.lotCard, { width: CARD_W }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Imagen / placeholder */}
      <View style={styles.lotImgWrap}>
        <LinearGradient colors={gradientColors} style={styles.lotImgPlaceholder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <MaterialIcons name={iconName} size={48} color="rgba(255,255,255,0.25)" />
        </LinearGradient>

        {/* Badges sobre la imagen */}
        <View style={styles.lotImgBadges}>
          {!vendido && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE AUCTION</Text>
            </View>
          )}
          <View style={styles.lotNumBadge}>
            <Text style={styles.lotNumBadgeText}>LOT #{String(index + 1).padStart(3, '0')}</Text>
          </View>
        </View>

        {/* Estado vendido overlay */}
        {vendido && (
          <View style={styles.soldOverlay}>
            <Text style={styles.soldText}>VENDIDO</Text>
          </View>
        )}
      </View>

      {/* Info debajo */}
      <View style={styles.lotInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lotName} numberOfLines={2}>
            {item.producto || `Item ${item.itemId}`}
          </Text>
          <Text style={styles.lotBase}>Base: {subasta.moneda} {item.precioBase}</Text>
        </View>

        {/* Bid info */}
        <View style={styles.bidBox}>
          <View style={styles.bidLockIcon}>
            <MaterialIcons name="lock" size={14} color={p.primary} />
          </View>
          <View>
            <Text style={styles.bidLabel}>PRECIO BASE</Text>
            <Text style={styles.bidValue}>{subasta.moneda} {item.precioBase}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function InfoChip({ icon, label }) {
  return (
    <View style={styles.chip}>
      <MaterialIcons name={icon} size={13} color={p.muted} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export default function SubastaDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [subasta, setSubasta] = useState(null);
  const [items, setItems] = useState([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const pendingVerification = user?.estado === 'pending_verification';

  const load = useCallback(async () => {
    if (pendingVerification) return;
    setError(null);
    try {
      const [s, its, mis] = await Promise.all([
        subastasApi.getById(id),
        subastasApi.getItems(id),
        clienteApi.misSubastas(),
      ]);
      setSubasta(s);
      setItems(its);
      setJoined((mis || []).some((m) => m.subastaId === id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, pendingVerification]);

  useEffect(() => { if (!pendingVerification) load(); }, [load, pendingVerification]);

  async function onJoin() {
    setJoining(true);
    try {
      const res = await clienteApi.unirse(id);
      setJoined(true);
      Alert.alert('Te uniste', `Sos el postor N° ${res.numeroPostor}`);
    } catch (err) {
      if (err.code === 'NO_VERIFIED_PAYMENT_METHOD') {
        Alert.alert(
          'Falta un medio de pago',
          'Necesitás un medio de pago verificado para unirte a una subasta.',
          [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Agregar medio de pago', onPress: () => navigation.navigate('PaymentMethods') },
          ]
        );
      } else {
        Alert.alert('No se pudo unir', err.message || 'Error');
      }
    } finally {
      setJoining(false);
    }
  }

  function scrollCarousel(dir) {
    const next = Math.max(0, Math.min(items.length - 1, activeIndex + dir));
    carouselRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  }

  if (pendingVerification) {
    return (
      <View style={styles.blocked}>
        <Text style={styles.blockedTitle}>Cuenta en verificación</Text>
        <Text style={styles.blockedText}>
          Tu cuenta todavía está pendiente de aprobación. Vas a poder entrar a subastas cuando un administrador la verifique.
        </Text>
        <Button title="Volver al inicio" onPress={() => navigation.navigate('Subastas')} />
      </View>
    );
  }

  if (loading) return <Loading text="Cargando subasta..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return (
    <ScrollView style={{ backgroundColor: p.background }} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Editorial header */}
      <View style={[styles.editorialHeader, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.exhibitionLabel}>
          SPECIAL EXHIBITION: {(subasta.categoria || 'SUBASTA').toUpperCase()}
        </Text>
        <Text style={styles.editorialTitle}>
          {subasta.categoria || `Subasta #${subasta.id}`}
        </Text>

        <View style={styles.chipsRow}>
          <InfoChip icon="calendar-today" label={`${subasta.fecha} · ${subasta.hora}`} />
          <InfoChip icon="person" label={`Subasta #${subasta.id}`} />
          <InfoChip icon="location-on" label={subasta.ubicacion} />
        </View>

        {/* Flechas nav + botón unirse */}
        <View style={styles.headerActions}>
          <View style={styles.arrowBtns}>
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={() => scrollCarousel(-1)}
              disabled={activeIndex === 0}
            >
              <MaterialIcons
                name="arrow-back"
                size={20}
                color={activeIndex === 0 ? p.border : p.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={() => scrollCarousel(1)}
              disabled={activeIndex === items.length - 1}
            >
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={activeIndex === items.length - 1 ? p.border : p.text}
              />
            </TouchableOpacity>
          </View>

          {joined ? (
            <View style={styles.joinedPill}>
              <MaterialIcons name="check-circle" size={14} color={p.success} />
              <Text style={styles.joinedPillText}>Unido</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={onJoin} disabled={joining} activeOpacity={0.88}>
              <LinearGradient
                colors={joining ? ['#ABA9D7', '#ABA9D7'] : ['#0846ED', '#859AFF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.joinPill}
              >
                <Text style={styles.joinPillText}>
                  {joining ? 'Uniéndose...' : 'Unirme'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Carrusel */}
      <FlatList
        ref={carouselRef}
        data={items}
        keyExtractor={(it) => String(it.itemId)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 16}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 16));
          setActiveIndex(idx);
        }}
        renderItem={({ item, index }) => (
          <LotCard
            item={item}
            index={index}
            subasta={subasta}
            joined={joined}
            onPress={() =>
              navigateWithReturnTo(navigation, 'ItemDetail', {
                subastaId: id,
                itemId: item.itemId,
                nombre: item.producto,
                joined,
              })
            }
          />
        )}
      />

      {/* Dots */}
      {items.length > 1 && (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>Vehículos únicos en catálogo</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {items.filter((i) => i.subastado !== 'si').length}
          </Text>
          <Text style={styles.statLabel}>Postores registrados actualmente</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  blocked: { flex: 1, backgroundColor: p.background, padding: 24, alignItems: 'center', justifyContent: 'center' },
  blockedTitle: { color: p.text, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  blockedText: { color: p.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24 },

  // Editorial header
  editorialHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exhibitionLabel: {
    fontSize: 10, fontWeight: '800', color: p.primary,
    letterSpacing: 2, marginBottom: 10,
  },
  editorialTitle: {
    fontSize: 38, fontWeight: '900', color: p.text,
    lineHeight: 42, letterSpacing: -0.5, marginBottom: 14,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: p.surfaceLow,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: p.muted },

  headerActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  arrowBtns: { flexDirection: 'row', gap: 8 },
  arrowBtn: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, borderColor: p.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: p.surface,
  },
  joinPill: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999,
    shadowColor: p.primary, shadowOpacity: 0.25,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  joinPillText: { color: p.white, fontWeight: '800', fontSize: 14 },
  joinedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: p.successFaint,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  joinedPillText: { color: p.success, fontWeight: '700', fontSize: 14 },

  // Carrusel
  carousel: { paddingLeft: 20, paddingRight: 8, paddingTop: 12, paddingBottom: 8 },
  lotCard: {
    marginRight: 16,
    backgroundColor: p.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: p.border,
    shadowColor: p.text,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lotImgWrap: { width: '100%', height: CARD_H, position: 'relative' },
  lotImgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  lotImgBadges: {
    position: 'absolute', top: 14, left: 14, flexDirection: 'column', gap: 6,
  },
  liveBadge: {
    backgroundColor: '#F790E0',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  liveBadgeText: { color: '#5F0656', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  lotNumBadge: {
    backgroundColor: 'rgba(249,245,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  lotNumBadgeText: { color: p.text, fontSize: 11, fontWeight: '800' },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,42,81,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  soldText: { color: p.white, fontSize: 22, fontWeight: '900', letterSpacing: 3 },

  lotInfo: {
    padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  lotName: { fontSize: 18, fontWeight: '800', color: p.text, lineHeight: 22, marginBottom: 2 },
  lotBase: { fontSize: 12, color: p.muted },
  bidBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: p.surfaceLow, borderRadius: 12,
    padding: 10, minWidth: 110,
    borderWidth: 1, borderColor: p.border,
  },
  bidLockIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: p.primaryFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  bidLabel: { fontSize: 8, fontWeight: '800', color: p.muted, letterSpacing: 1.2 },
  bidValue: { fontSize: 12, fontWeight: '800', color: p.primary },

  // Dots
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.border },
  dotActive: { width: 18, backgroundColor: p.primary },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: p.surfaceLow,
    borderRadius: 20, marginHorizontal: 20,
    marginTop: 24, padding: 24,
    alignItems: 'center',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 30, fontWeight: '900', color: p.primary, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: p.muted, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: p.border, marginHorizontal: 16 },
});