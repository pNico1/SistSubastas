import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';

import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';

import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import BidCard from '../components/BidCard';

const auctions = [
  {
    id: '1',
    title: 'Avenue Collection',
    category: 'Classic Motors',
    lots: 12,
    timeLeft: '2h 15m',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
    live: true,
  },
  {
    id: '2',
    title: 'Timeless Horology',
    category: 'Luxury Watches',
    lots: 8,
    timeLeft: '4h 42m',
    image:
      'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
  },
  {
    id: '3',
    title: 'Modernist Canvas',
    category: 'Fine Art',
    lots: 24,
    timeLeft: '1d 2h',
    image:
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262',
  },
  {
    id: '4',
    title: 'Azure Elegance',
    category: 'High Jewelry',
    lots: 5,
    timeLeft: '5h 12m',
    image:
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638',
  },
];

export default function PujasScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <TopAppBar navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Live Bids</Text>

        <Text style={styles.subtitle}>
          Descubrí subastas activas y artículos exclusivos.
        </Text>

        <SearchBar />

        <FilterChips />

        <FlatList
          horizontal
          pagingEnabled
          snapToAlignment="center"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          data={auctions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.carousel}
          renderItem={({ item }) => (
            <BidCard
              item={item}
              navigation={navigation}
            />
          )}
        />
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
    paddingBottom: 40,
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
});