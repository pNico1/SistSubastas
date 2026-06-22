// src/screens/PujasScreen.js
// Explorador de subastas abiertas (datos reales de la API) con buscador y filtros.
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
import { formatDate, formatTime, parseServerDateAndTime } from '../utils/datetime';

function fechaInicio(fecha, hora) {
  const inicio = parseServerDateAndTime(fecha, hora);
  return inicio ? formatDate(inicio) : fecha || 'Fecha a confirmar';
}

function horaInicio(fecha, hora) {
  const inicio = parseServerDateAndTime(fecha, hora);
  return inicio ? formatTime(inicio) : hora || 'Hora a confirmar';
}

export default function PujasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [subastas, setSubastas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('Todos');

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await subastasApi.listar({ estado: 'abierta', pageSize: 50 });
      setSubastas(res?.data || []);
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

  // Chips de categoria construidos a partir de los datos reales.
  const filters = useMemo(() => {
    const cats = Array.from(
      new Set(subastas.map((s) => s.categoria).filter(Boolean))
    );
    return ['Todos', ...cats];
  }, [subastas]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subastas
      .filter((s) => (categoria === 'Todos' ? true : s.categoria === categoria))
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
        dateLabel: fechaInicio(s.fecha, s.hora),
        startTime: horaInicio(s.fecha, s.hora),
        image: `https://picsum.photos/seed/subasta${s.id}/600/400`,
        live: s.estado === 'abierta',
      }));
  }, [subastas, query, categoria]);

  return (
    <View style={styles.container}>
      <TopAppBar navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 72 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Subastas en vivo</Text>
        <Text style={styles.subtitle}>
          Descubrí subastas activas y artículos exclusivos.
        </Text>

        <SearchBar value={query} onChangeText={setQuery} />

        <FilterChips filters={filters} active={categoria} onSelect={setCategoria} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0846ED" size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No pudimos cargar las subastas</Text>
            <Text style={styles.emptyText}>Deslizá para reintentar.</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>
              No hay subastas abiertas que coincidan con tu búsqueda.
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
