// src/components/AuctionSlide.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import LiveBadge from './LiveBadge';
import { MaterialIcons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const palette = {
  primary:      '#0846ED',
  primaryLight: '#859AFF',
  white:        '#FFFFFF',
  text:         '#2B2A51',
  muted:        'rgba(255,255,255,0.6)',
  mutedMid:     'rgba(255,255,255,0.78)',
};

// Boton con el mismo spring del LoginScreen
function BidButton({ onPress, label }) {
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
          <Text style={styles.bidButtonText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AuctionSlide({ item, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [item.image]);
  // Navega al detalle real del item (pantalla de puja con polling de oferta).
  const handleBid = () => {
    navigation.navigate('ItemDetail', {
      subastaId: item.subastaId,
      itemId: item.itemId,
      nombre: item.title,
      joined: item.joined,
    });
  };

  return (
    <View style={styles.slide}>
      <ImageBackground
        source={item.image && !imageFailed ? { uri: item.image } : undefined}
        style={styles.image}
        resizeMode="cover"
        onError={() => setImageFailed(true)}
      >
        {(!item.image || imageFailed) ? <View style={styles.imageFallback}><MaterialIcons name="image" size={64} color="rgba(255,255,255,.22)" /></View> : null}
        {/* Gradiente oscuro en la parte inferior */}
        <LinearGradient
          colors={['transparent', 'rgba(8,8,40,0.88)']}
          locations={[0.25, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.contentOverlay, { paddingBottom: insets.bottom + 120 }]}>
          {/* Info del item */}
          <View style={styles.infoBlock}>
            <LiveBadge />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>

          {/* Tarjeta de oferta */}
          {user ? (
            <View style={styles.bidCard}>
              <View style={styles.bidCardLeft}>
                <Text style={styles.bidLabel}>OFERTA ACTUAL</Text>
                <Text style={styles.bidAmount}>{item.currentBid}</Text>
                <Text style={styles.bidMeta}>Lote {item.lot} · Cierra {item.endsIn}</Text>
              </View>
              <BidButton onPress={handleBid} label="Pujar  ›" />
            </View>
          ) : (
            <View style={styles.guestCard}>
              <Text style={styles.guestText}>Lote {item.lot} · Consultá sus detalles e imágenes</Text>
              <BidButton onPress={handleBid} label="Ver lote  ›" />
            </View>
          )}
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
    backgroundColor: '#0a082f',
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
    textTransform: 'capitalize',
  },

  // Tarjeta de oferta
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
  guestCard: {
    backgroundColor: 'rgba(249,245,255,0.13)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', gap: 14,
  },
  imageFallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  guestText: { flex: 1, color: palette.mutedMid, fontSize: 13, lineHeight: 18, fontWeight: '600' },
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

  // Boton
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
