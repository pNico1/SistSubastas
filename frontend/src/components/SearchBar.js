import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
} from 'react-native';

export default function SearchBar() {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Buscar subastas..."
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#E2DFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
});