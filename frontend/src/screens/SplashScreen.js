import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

// Pantalla introductoria mientras se restaura la sesion.
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🔨</Text>
      <Text style={styles.title}>Subastas</Text>
      <Text style={styles.subtitle}>Tu casa de remates online</Text>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  logo: { fontSize: 64 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 12 },
  subtitle: { color: colors.accent, fontSize: 16, marginTop: 4 },
});
