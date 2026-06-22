// src/screens/BidsterScreen.js
// Feed vertical estilo "reels" de items en subastas activas y futuras.
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AuctionSlide from '../components/AuctionSlide';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import { subastasApi, clienteApi } from '../api/endpoints';
import { firstPhotoUri } from '../utils/images';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAX_SUBASTAS_ACTIVAS = 8;
const MAX_SUBASTAS_FUTURAS = 12;
const MAX_ITEMS_POR_SUBASTA = 3;
const MAX_SLIDES = 30;
const FUTURE_PAGE_SIZE = 4;
const FUTURE_BATCH_SIZE = 2;

function formatMoney(moneda, val) {
  if (val == null) return 'Inicia sesion para ver';
  const n = Number(val);
  const formatted = isNaN(n) ? String(val) : n.toLocaleString('es-AR');
  return `${moneda ? moneda + ' ' : ''}${formatted}`;
}

function isFutureSubasta(subasta) {
  return subasta?.estado == null && !!subasta.fecha;
}

export default function BidsterScreen({ navigation }) {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFuture, setLoadingFuture] = useState(false);
  const [error, setError] = useState(false);
  const loadSeq = useRef(0);

  const buildSlides = useCallback(async (subastas, joinedIds, tipo) => {
    const perSubasta = await Promise.all(
      subastas.map((s) =>
        subastasApi
          .getItems(s.id)
          .then((its) => ({ s, its: its || [] }))
          .catch(() => ({ s, its: [] }))
      )
    );

    const pares = [];
    perSubasta.forEach(({ s, its }) => {
      its
        .filter((it) => it.subastado !== 'si')
        .slice(0, MAX_ITEMS_POR_SUBASTA)
        .forEach((it) => pares.push({ s, it }));
    });

    const conOferta = await Promise.all(
      pares.map(async ({ s, it }) => {
        const [of, fotos] = await Promise.all([
          subastasApi.getOfertaActual(s.id, it.itemId).catch(() => null),
          it.imagenUrl ? Promise.resolve([]) : subastasApi.getItemPhotos(s.id, it.itemId).catch(() => []),
        ]);
        return { s, it, of, fotos };
      })
    );

    return conOferta.map(({ s, it, of, fotos }) => ({
      key: `${tipo}-${s.id}-${it.itemId}`,
      subastaId: s.id,
      itemId: it.itemId,
      productoId: it.productoId,
      title: it.producto || `Item ${it.itemId}`,
      subtitle: `${tipo === 'activa' ? 'Subasta en vivo' : 'Proxima subasta'} #${s.id} · ${s.categoria || ''}`.trim(),
      currentBid: formatMoney(s.moneda, of?.ofertaActual ?? of?.precioBase ?? it.precioBase),
      lot: `#${it.itemId}`,
      endsIn: `${s.fecha || ''} ${s.hora || ''}`.trim() || 'pronto',
      image: it.imagenUrl || firstPhotoUri(fotos),
      joined: joinedIds.has(s.id),
      tipo,
    }));
  }, []);

  const appendSlides = useCallback((newSlides) => {
    setSlides((current) => {
      const existing = new Set(current.map((x) => x.key));
      const unique = newSlides.filter((x) => !existing.has(x.key));
      return [...current, ...unique].slice(0, MAX_SLIDES);
    });
  }, []);

  const loadFutureSlides = useCallback(async (seq, joinedIds, seenSubastaIds) => {
    setLoadingFuture(true);
    let addedSubastas = 0;
    let page = 0;

    try {
      while (addedSubastas < MAX_SUBASTAS_FUTURAS) {
        const res = await subastasApi.listar({ page, pageSize: FUTURE_PAGE_SIZE });
        if (loadSeq.current !== seq) return;

        const futuras = (res?.data || [])
          .filter((s) => isFutureSubasta(s) && !seenSubastaIds.has(s.id))
          .slice(0, Math.max(0, MAX_SUBASTAS_FUTURAS - addedSubastas));

        for (let i = 0; i < futuras.length; i += FUTURE_BATCH_SIZE) {
          const batch = futuras.slice(i, i + FUTURE_BATCH_SIZE);
          batch.forEach((s) => seenSubastaIds.add(s.id));
          const batchSlides = await buildSlides(batch, joinedIds, 'futura');
          if (loadSeq.current !== seq) return;
          appendSlides(batchSlides);
          addedSubastas += batch.length;
        }

        if (!res || page + 1 >= (res.totalPages || 0) || (res?.data || []).length === 0) break;
        page += 1;
      }
    } finally {
      if (loadSeq.current === seq) setLoadingFuture(false);
    }
  }, [appendSlides, buildSlides]);

  const load = useCallback(async () => {
    const seq = loadSeq.current + 1;
    loadSeq.current = seq;
    setError(false);
    setLoadingFuture(false);

    try {
      const subRes = await subastasApi.listar({ estado: 'abierta', pageSize: 50 });
      if (loadSeq.current !== seq) return;
      const subastasActivas = (subRes?.data || []).slice(0, MAX_SUBASTAS_ACTIVAS);

      const mis = await clienteApi.misSubastas().catch(() => []);
      if (loadSeq.current !== seq) return;
      const joinedIds = new Set((mis || []).map((m) => m.subastaId));
      const seenSubastaIds = new Set(subastasActivas.map((s) => s.id));

      const activeSlides = await buildSlides(subastasActivas, joinedIds, 'activa');
      if (loadSeq.current !== seq) return;
      setSlides(activeSlides.slice(0, MAX_SLIDES));
      setLoading(false);

      loadFutureSlides(seq, joinedIds, seenSubastaIds);
    } catch (err) {
      if (loadSeq.current !== seq) return;
      setError(true);
      setLoadingFuture(false);
      setLoading(false);
    }
  }, [buildSlides, loadFutureSlides]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
      return () => {
        loadSeq.current += 1;
      };
    }, [load])
  );

  const getItemLayout = (_, index) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  });

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#859AFF" size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.msgTitle}>No pudimos cargar el feed</Text>
          <Text style={styles.msgText}>Revisa tu conexion e intenta de nuevo.</Text>
        </View>
      ) : slides.length === 0 && loadingFuture ? (
        <View style={styles.center}>
          <ActivityIndicator color="#859AFF" size="large" />
          <Text style={styles.loadingText}>Cargando proximas subastas...</Text>
        </View>
      ) : slides.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.msgTitle}>No hay subastas disponibles</Text>
          <Text style={styles.msgText}>Cuando haya items en vivo o proximos, van a aparecer aca.</Text>
        </View>
      ) : (
        <FlatList
          data={slides}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <AuctionSlide item={item} navigation={navigation} />
          )}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
          getItemLayout={getItemLayout}
          removeClippedSubviews
          bounces={false}
          overScrollMode="never"
          ListFooterComponent={loadingFuture ? (
            <View style={styles.futureLoading}>
              <ActivityIndicator color="#859AFF" />
              <Text style={styles.futureLoadingText}>Cargando proximas subastas...</Text>
            </View>
          ) : null}
        />
      )}

      <TopAppBar navigation={navigation} />
      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a082f',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  msgTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  msgText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  futureLoading: {
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  futureLoadingText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '700',
  },
});
