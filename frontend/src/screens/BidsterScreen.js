import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const colors = {
  primary: '#0846ed',
  primaryContainer: '#859aff',
  onSurfaceVariant: '#585781',
  surfaceContainerHigh: '#e2dfff',
  background: '#f4f3ff',
};

export default function BidsterScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <View style={styles.content}>

        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconShadow} />
          <Image
            source={require('../assets/logo_subastas.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={styles.brandName}>BIDSTER</Text>
          <Text style={styles.brandSubtitle}>THE KINETIC GALLERY</Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowTopRight: {
    position: 'absolute',
    top: -height * 0.12,
    right: -width * 0.15,
    width: width * 0.6,
    height: height * 0.45,
    borderRadius: 9999,
    backgroundColor: colors.surfaceContainerHigh,
    opacity: 0.5,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -height * 0.06,
    left: -width * 0.08,
    width: width * 0.35,
    height: height * 0.28,
    borderRadius: 9999,
    backgroundColor: colors.primaryContainer,
    opacity: 0.12,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
 
  logo: {
    width: 220,
    height: 220,
    borderRadius: 40,
  },
  brandContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.primary,
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 4,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
    textTransform: 'uppercase',
  },
});