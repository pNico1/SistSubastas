import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

const DEFAULT_FILTERS = ['Todos', 'En Vivo', 'Arte', 'Relojes', 'Autos'];

// Controlado: recibe filters/active/onSelect para filtrar la lista real.
export default function FilterChips({
  filters = DEFAULT_FILTERS,
  active,
  onSelect,
}) {
  const current = active ?? filters[0];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {filters.map((item) => {
        const isActive = item === current;
        return (
          <TouchableOpacity
            key={item}
            style={[styles.chip, isActive && styles.activeChip]}
            onPress={() => onSelect && onSelect(item)}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },

  content: {
    paddingHorizontal: 20,
  },

  chip: {
    backgroundColor: '#E2DFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    marginRight: 10,
  },

  activeChip: {
    backgroundColor: '#0846ED',
  },

  text: {
    color: '#585781',
    fontWeight: '600',
  },

  activeText: {
    color: '#fff',
  },
});
