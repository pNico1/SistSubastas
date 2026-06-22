// src/screens/PujasScreen.js
// Explorador de subastas activas y futuras con buscador y filtros.
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import BidCard from '../components/BidCard';
import { subastasApi } from '../api/endpoints';
import { firstPhotoUri } from '../utils/images';

function shortFecha(fecha, hora) {
  if (!fecha) return hora || 'pronto';
  const parts = String(fecha).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return String(fecha);
}

function isFutureSubasta(subasta) {
  return subasta?.estado == null && !!subasta.fecha;
}

async function resolveSubastaImage(subasta) {
  if (subasta.imagenUrl) return subasta.imagenUrl;

  const items = await subastasApi.getItems(subasta.id).catch(() => []);
  const itemConImagen = (items || []).find((item) => item.imagenUrl);
  if (itemConImagen?.imagenUrl) return itemConImagen.imagenUrl;

  for (const item of items || []) {
    const fotos = await subastasApi
      .getItemPhotos(subasta.id, item.itemId)
      .catch(() => []);
    const uri = firstPhotoUri(fotos);
    if (uri) return uri;
  }

  return null;
}

export default function PujasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [subastas, setSubastas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState('Todos');

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await subastasApi.listar({ pageSize: 50 });
      const disponibles = (res?.data || []).filter((s) => s.estado === 'abierta' || isFutureSubasta(s));
      const conImagenes = await Promise.all(
        disponibles.map(async (subasta) => {
          const imagenUrl = await resolveSubastaImage(subasta);
          return { ...subasta, imagenUrl };
        })
      );
      setSubastas(conImagenes);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filters = useMemo(() => {
    const cats = Array.from(
      new Set(subastas.map((s) => s.categoria).filter(Boolean))
    );
    return ['Todos', 'En Vivo', 'Proximas', ...cats];
  }, [subastas]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subastas
      .filter((s) => {
        if (filtro === 'Todos') return true;
        if (filtro === 'En Vivo') return s.estado === 'abierta';
        if (filtro === 'Proximas') return isFutureSubasta(s);
        return s.categoria === filtro;
      })
      .filter((s) => {
        if (!q) return true;
        return (
          String(s.id).includes(q) ||
          (s.categoria || '').toLowerCase().includes(q) ||
          (s.ubicacion || '').toLowerCase().includes(q)
        );
      })
      .map((s) => ({
        id: String(s.id),
        title: `Subasta #${s.id}`,
        category: s.categoria || 'General',
        lots: s.cantidadItems ?? 0,
        timeLeft: shortFecha(s.fecha, s.hora),
        image: s.imagenUrl || null,
        live: s.estado === 'abierta',
        future: isFutureSubasta(s),
      }));
  }, [subastas, query, filtro]);

  return (
    <View style={styles.container}>
      <TopAppBar navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 72 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Explorar Subastas</Text>
        <Text style={styles.subtitle}>
          Descubri subastas activas, proximas fechas y articulos exclusivos.
        </Text>

        <SearchBar value={query} onChangeText={setQuery} />

        <FilterChips filters={filters} active={filtro} onSelect={setFiltro} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0846ED" size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No pudimos cargar las subastas</Text>
            <Text style={styles.emptyText}>Desliza para reintentar.</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              No hay subastas que coincidan con tu busqueda.
            </Text>
          </View>
        ) : (
          <FlatList
            horizontal
            pagingEnabled
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.carousel}
            renderItem={({ item }) => (
              <BidCard item={item} navigation={navigation} />
            )}
          />
        )}
      </ScrollView>

      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5FF',
  },

  content: {
    paddingTop: 100,
    paddingBottom: 110,
  },

  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2B2A51',
    paddingHorizontal: 20,
  },

  subtitle: {
    fontSize: 15,
    color: '#585781',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  carousel: {
    paddingLeft: 20,
    paddingRight: 20,
    marginTop: 10,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2A51',
    marginBottom: 6,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#585781',
    textAlign: 'center',
  },
});
