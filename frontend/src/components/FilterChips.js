import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

export default function FilterChips() {
  const filters = [
    'Todos',
    'En Vivo',
    'Arte',
    'Relojes',
    'Autos',
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {filters.map((item, index) => (
        <TouchableOpacity
          key={item}
          style={[
            styles.chip,
            index === 0 && styles.activeChip,
          ]}
        >
          <Text
            style={[
              styles.text,
              index === 0 && styles.activeText,
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
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