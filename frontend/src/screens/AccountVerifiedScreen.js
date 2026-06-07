import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const palette = {
  background: '#F9F5FF',
  primary: '#2357FF',
  primarySoft: '#6F86FF',
  text: '#2B2A51',
  muted: '#8B88A8',
  surface: '#FFFFFF',
  border: '#ECE8FF',
};

export default function AccountVerifiedScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient
        colors={['#F9F5FF', '#F1ECFF', '#F8D7F1']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.badgeOuter}>
              <View style={styles.badgeInner}>
                <Text style={styles.badgeIcon}>✓</Text>
              </View>
            </View>

            <Text style={styles.title}>¡Cuenta Verificada!</Text>
            <Text style={styles.subtitle}>
              Tu identidad ha sido confirmada con éxito. Ahora tienes acceso total a las subastas y funciones de Bidster.
            </Text>

          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('RegisterComplete')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Comenzar a Explorar</Text>
          </TouchableOpacity>

          <View style={styles.cards}>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>⌁</Text>
              <Text style={styles.cardTitle}>SUBASTAS EN VIVO</Text>
              <Text style={styles.cardText}>Listo para pujar por piezas exclusivas.</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>◆</Text>
              <Text style={styles.cardTitle}>NIVEL DE CONFIANZA</Text>
              <Text style={styles.cardText}>Estado de identidad verificada activo.</Text>
            </View>
          </View>

          <Text style={styles.brand}>BIDSTER</Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  gradient: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 58,
    paddingBottom: 34,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 42,
  },
  badgeOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#7D75E8',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  badgeInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 315,
  },
  button: {
    height: 58,
    borderRadius: 9,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 64,
    shadowColor: palette.primary,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  cards: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    minHeight: 108,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: 15,
  },
  cardIcon: { color: palette.primary, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  cardTitle: { color: palette.text, fontSize: 9, lineHeight: 13, fontWeight: '900', marginBottom: 6 },
  cardText: { color: palette.muted, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  brand: {
    color: '#BFB8D8',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 5,
    textAlign: 'center',
    marginTop: 'auto',
  },
});
