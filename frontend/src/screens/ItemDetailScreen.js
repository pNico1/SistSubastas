import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { subastasApi, clienteApi, productosPublicosApi } from '../api/endpoints';
import { POLLING_MS } from '../config';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import ScreenHeader from '../components/ScreenHeader';

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

export default function ItemDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { subastaId, itemId, productoId, nombre } = route.params;
  // El flag 'joined' que llega por params puede estar desactualizado (ej: te uniste
  // en otra pantalla). Se usa como valor inicial y se revalida contra el backend.
  const [joined, setJoined] = useState(route.params.joined ?? false);
  const [oferta, setOferta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importe, setImporte] = useState('');
  const [importeError, setImporteError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [itemActivoId, setItemActivoId] = useState(null);
  const [subEstado, setSubEstado] = useState(null);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [segundos, setSegundos] = useState(null);
  const [ventana, setVentana] = useState(30);
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

  useEffect(() => {
    subastasApi.getItemPhotos(subastaId, itemId)
      .then((data) => setFotos(data || []))
      .catch(() => setFotos([]));
  }, [subastaId, itemId]);

  useEffect(() => {
    if (productoId == null) {
      setProductoDetalle(null);
      return undefined;
    }
    let alive = true;
    productosPublicosApi.getById(productoId)
      .then((data) => {
        if (alive) setProductoDetalle(data);
      })
      .catch(() => {
        if (alive) setProductoDetalle(null);
      });
    return () => { alive = false; };
  }, [productoId]);

  // Revalida la union real contra el backend, por si el param venia desactualizado.
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    clienteApi.misSubastas()
      .then((list) => {
        if (alive) setJoined((list || []).some((m) => Number(m.subastaId) === Number(subastaId)));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [subastaId, user]);

  // Item activo + segundos de inactividad restantes (motor temporal).
  const fetchItemActivo = useCallback(async () => {
    try {
      const data = await subastasApi.itemActivo(subastaId);
      setItemActivoId(data?.itemActivoId ?? null);
      setSubEstado(data?.estado ?? null);
      setVentana(Number(data?.ventanaSeg) || 30);
      if (Number(data?.itemActivoId) === Number(itemId) && data?.segundosRestantes != null) {
        setSegundos(Number(data.segundosRestantes));
      } else {
        setSegundos(null);
      }
    } catch { /* noop */ }
  }, [subastaId, itemId]);

  useEffect(() => {
    if (pendingVerification) return undefined;
    fetchItemActivo();
    const t = setInterval(fetchItemActivo, POLLING_MS);
    return () => clearInterval(t);
  }, [fetchItemActivo, pendingVerification]);

  // Tick local de 1s para que la barra baje suave entre polls.
  useEffect(() => {
    if (segundos == null) return undefined;
    const t = setInterval(() => {
      setSegundos((s) => (s == null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [segundos == null]);

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
      importeTocado.current = false;
      await fetchOferta();
      await fetchItemActivo();
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
  const esActivo = itemActivoId != null && Number(itemActivoId) === Number(itemId);
  const ratio = Math.min(1, Math.max(0, (segundos || 0) / (ventana || 30)));
  const barColor = segundos != null && segundos <= 5 ? p.danger
    : segundos != null && segundos <= 10 ? p.warning
    : p.success;
  const descripcion = productoDetalle?.descripcionCompleta
    || productoDetalle?.historia
    || productoDetalle?.descripcionCatalogo;

  return (
    <View style={{ flex: 1, backgroundColor: p.background }}>
    <ScreenHeader navigation={navigation} route={route} title="Detalle del lote" showNotifications={!!user} />
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

      {fotos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {fotos.map((foto) => {
            const uri = foto.url || (foto.contenidoBase64 ? `data:image/jpeg;base64,${foto.contenidoBase64}` : null);
            return uri ? <Image key={foto.id} source={{ uri }} style={styles.galleryImage} /> : null;
          })}
        </ScrollView>
      ) : null}

      {descripcion ? (
        <View style={styles.descriptionCard}>
          <View style={styles.descriptionHeader}>
            <MaterialIcons name="description" size={16} color={p.primary} />
            <Text style={styles.descriptionLabel}>DESCRIPCIÓN</Text>
          </View>
          <Text style={styles.descriptionText}>{descripcion}</Text>
          {productoDetalle?.nombreArtista ? (
            <Text style={styles.descriptionMeta}>Artista / autor: {productoDetalle.nombreArtista}</Text>
          ) : null}
          {productoDetalle?.fechaObra ? (
            <Text style={styles.descriptionMeta}>Fecha de obra: {productoDetalle.fechaObra}</Text>
          ) : null}
        </View>
      ) : null}

      {!user ? (
        <View style={styles.aviso}>
          <MaterialIcons name="lock" size={18} color={p.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.avisoText, { color: p.text, fontWeight: '800' }]}>Precios disponibles para usuarios registrados</Text>
            <Text style={styles.avisoText}>Podés ver la pieza y sus fotos. Iniciá sesión para consultar precios y participar.</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}><Text style={{ color: p.primary, fontWeight: '900' }}>Ingresar</Text></TouchableOpacity>
        </View>
      ) : (
      <View style={styles.baseCard}>
        <Text style={styles.baseLabel}>PRECIO BASE</Text>
        <Text style={styles.baseValue}>{oferta.precioBase}</Text>
      </View>
      )}

      {/* Oferta actual — carta principal */}
      {user ? <View style={styles.ofertaCard}>
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
      </View> : null}

      {/* Barra de inactividad del item activo */}
      {esActivo && segundos != null ? (
        <View style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <MaterialIcons name="timer" size={15} color={barColor} />
            <Text style={[styles.timerLabel, { color: barColor }]}>
              Cierra en {segundos}s por inactividad
            </Text>
          </View>
          <View style={styles.timerTrack}>
            <View style={[styles.timerFill, { width: `${ratio * 100}%`, backgroundColor: barColor }]} />
          </View>
          <Text style={styles.timerHint}>Cada nueva puja reinicia el contador.</Text>
        </View>
      ) : subEstado === 'cerrada' ? (
        <View style={styles.estadoPill}>
          <MaterialIcons name="lock" size={15} color={p.danger} />
          <Text style={[styles.estadoPillText, { color: p.danger }]}>La subasta finalizó</Text>
        </View>
      ) : itemActivoId != null && !esActivo ? (
        <View style={styles.estadoPill}>
          <MaterialIcons name="hourglass-empty" size={15} color={p.warning} />
          <Text style={[styles.estadoPillText, { color: p.warning }]}>
            Este lote todavía no se está subastando
          </Text>
        </View>
      ) : null}

      {/* Polling hint */}
      <View style={styles.liveHint}>
        <MaterialIcons name="sync" size={13} color={p.muted} />
        <Text style={styles.liveHintText}>La oferta se actualiza automáticamente</Text>
      </View>

      {/* Formulario de puja o aviso */}
      {!user ? (
        <TouchableOpacity style={styles.aviso} onPress={() => navigation.navigate('Login')}>
          <MaterialIcons name="login" size={18} color={p.primary} />
          <Text style={[styles.avisoText, { color: p.primary, fontWeight: '900' }]}>Iniciá sesión para unirte y pujar</Text>
        </TouchableOpacity>
      ) : !joined ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  blocked: { flex: 1, backgroundColor: p.background, padding: 24, alignItems: 'center', justifyContent: 'center' },
  blockedTitle: { color: p.text, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  blockedText: { color: p.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },

  container: { padding: 20 },

  // Header
  editorialHeader: { marginBottom: 20 },
  gallery: { marginBottom: 18 },
  galleryImage: { width: 230, height: 160, borderRadius: 14, marginRight: 10, backgroundColor: p.surfaceLow },
  lotBadge: {
    alignSelf: 'flex-start',
    backgroundColor: p.surface,
    borderWidth: 1, borderColor: p.border,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    marginBottom: 10,
  },
  lotBadgeText: { fontSize: 11, fontWeight: '800', color: p.text, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: p.text, lineHeight: 32, letterSpacing: -0.3 },
  descriptionCard: {
    backgroundColor: p.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: p.border,
  },
  descriptionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  descriptionLabel: { fontSize: 10, fontWeight: '900', color: p.muted, letterSpacing: 1.5 },
  descriptionText: { color: p.text, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  descriptionMeta: { color: p.muted, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 8 },

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

  // Barra de inactividad
  timerCard: {
    backgroundColor: p.surface, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: p.border,
  },
  timerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  timerLabel: { fontSize: 13, fontWeight: '800' },
  timerTrack: {
    height: 8, borderRadius: 999, backgroundColor: p.container, overflow: 'hidden',
  },
  timerFill: { height: 8, borderRadius: 999 },
  timerHint: { fontSize: 11, color: p.muted, marginTop: 8 },
  estadoPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: p.surface, borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: p.border,
  },
  estadoPillText: { fontSize: 13, fontWeight: '700' },

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
