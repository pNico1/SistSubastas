import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
} from 'react-native';

// Controlado: recibe value/onChangeText para poder filtrar de verdad.
export default function SearchBar({ value, onChangeText, placeholder = 'Buscar subastas...' }) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#8E8CB8"
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  input: {
    backgroundColor: '#E2DFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#2B2A51',
  },
});
