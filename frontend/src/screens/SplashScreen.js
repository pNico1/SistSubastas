import React from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';

// Pantalla introductoria mientras se restaura la sesion.
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo_subastas.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator color="#0846ED" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F5FF' },
  logo: { width: 180, height: 180 },
});
