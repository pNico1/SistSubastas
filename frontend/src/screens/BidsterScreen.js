// src/screens/BidsterScreen.js
// Feed vertical estilo "reels" de items en subastas abiertas (datos reales de la API).
import React, { useCallback, useState } from 'react';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAX_SUBASTAS = 8;
const MAX_ITEMS_POR_SUBASTA = 3;
const MAX_SLIDES = 15;

function formatMoney(moneda, val) {
  if (val == null) return '—';
  const n = Number(val);
  const formatted = isNaN(n) ? String(val) : n.toLocaleString('es-AR');
  return `${moneda ? moneda + ' ' : ''}${formatted}`;
}

export default function BidsterScreen({ navigation }) {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const subRes = await subastasApi.listar({ estado: 'abierta', pageSize: 50 });
      const subastas = (subRes?.data || []).slice(0, MAX_SUBASTAS);

      // Subastas a las que el usuario ya esta unido (para habilitar la puja directa).
      const mis = await clienteApi.misSubastas().catch(() => []);
      const joinedIds = new Set((mis || []).map((m) => m.subastaId));

      // Items de cada subasta abierta.
      const perSubasta = await Promise.all(
        subastas.map((s) =>
          subastasApi
            .getItems(s.id)
            .then((its) => ({ s, its: its || [] }))
            .catch(() => ({ s, its: [] }))
        )
      );

      let pares = [];
      perSubasta.forEach(({ s, its }) => {
        its
          .filter((it) => it.subastado !== 'si')
          .slice(0, MAX_ITEMS_POR_SUBASTA)
          .forEach((it) => pares.push({ s, it }));
      });
      pares = pares.slice(0, MAX_SLIDES);

      // Oferta actual de cada item (para mostrar el monto real).
      const conOferta = await Promise.all(
        pares.map(({ s, it }) =>
          subastasApi
            .getOfertaActual(s.id, it.itemId)
            .then((of) => ({ s, it, of }))
            .catch(() => ({ s, it, of: null }))
        )
      );

      const data = conOferta.map(({ s, it, of }) => ({
        key: `${s.id}-${it.itemId}`,
        subastaId: s.id,
        itemId: it.itemId,
        title: it.producto || `Item ${it.itemId}`,
        subtitle: `Subasta #${s.id} · ${s.categoria || ''}`.trim(),
        currentBid: formatMoney(s.moneda, of?.ofertaActual ?? of?.precioBase ?? it.precioBase),
        lot: `#${it.itemId}`,
        endsIn: `${s.fecha || ''} ${s.hora || ''}`.trim() || 'pronto',
        image: `https://picsum.photos/seed/sub${s.id}item${it.itemId}/800/1200`,
        joined: joinedIds.has(s.id),
      }));

      setSlides(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga cada vez que la pantalla toma foco (p. ej. al volver de pujar).
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
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
          <Text style={styles.msgText}>Revisá tu conexión e intentá de nuevo.</Text>
        </View>
      ) : slides.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.msgTitle}>No hay subastas abiertas</Text>
          <Text style={styles.msgText}>Cuando haya items en vivo, van a aparecer acá.</Text>
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
        />
      )}

      {/* Header flotante */}
      <TopAppBar navigation={navigation} />

      {/* Nav inferior flotante */}
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
});
