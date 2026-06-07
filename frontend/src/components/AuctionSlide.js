// src/components/AuctionSlide.js
import React, { useRef } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LiveBadge from './LiveBadge';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const palette = {
  primary:      '#0846ED',
  primaryLight: '#859AFF',
  white:        '#FFFFFF',
  text:         '#2B2A51',
  muted:        'rgba(255,255,255,0.6)',
  mutedMid:     'rgba(255,255,255,0.78)',
};

// Botón con el mismo spring del LoginScreen
function BidButton({ onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.bidButtonWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={[palette.primary, palette.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bidButtonGradient}
        >
          <Text style={styles.bidButtonText}>Pujar  ›</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AuctionSlide({ item, navigation }) {
  const handleBid = () => {
    Alert.alert('Pujar', `Vas a pujar por:\n${item.title}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'default' },
    ]);
  };

  return (
    <View style={styles.slide}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.image}
        resizeMode="cover"
      >
        {/* Gradiente oscuro en la parte inferior */}
        <LinearGradient
          colors={['transparent', 'rgba(8,8,40,0.88)']}
          locations={[0.25, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.contentOverlay}>
          {/* Info del ítem */}
          <View style={styles.infoBlock}>
            <LiveBadge />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>

          {/* Tarjeta de oferta — mismo estilo que infoCard del Login */}
          <View style={styles.bidCard}>
            <View style={styles.bidCardLeft}>
              <Text style={styles.bidLabel}>OFERTA ACTUAL</Text>
              <Text style={styles.bidAmount}>{item.currentBid}</Text>
              <Text style={styles.bidMeta}>
                Lote {item.lot} · Cierra en {item.endsIn}
              </Text>
            </View>
            <BidButton onPress={handleBid} />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: SCREEN_HEIGHT,
    width: '100%',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentOverlay: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 14,
  },

  // Info
  infoBlock: { gap: 4 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.mutedMid,
  },

  // Tarjeta de oferta — inspirada en infoCard del Login
  bidCard: {
    backgroundColor: 'rgba(249,245,255,0.13)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  bidCardLeft: { flex: 1, gap: 3 },
  bidLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: palette.muted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  bidAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.white,
    letterSpacing: -0.5,
  },
  bidMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.muted,
  },

  // Botón — mismo gradiente y shadow que el Login
  bidButtonWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  bidButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});