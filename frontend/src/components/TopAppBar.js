// src/components/TopAppBar.js
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const palette = {
  background: '#F9F5FF',
  primary:    '#0846ED',
  field:      '#DCD9FF',
  border:     'rgba(171,169,215,0.3)',
};

export default function TopAppBar({ navigation }) {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Text style={styles.brand}>BIDSTER</Text>

        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Perfil')}
            onPressIn={pressIn}
            onPressOut={pressOut}
            activeOpacity={1}
          >
            <MaterialIcons name="person" size={22} color={palette.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: '#F9F5FF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(171,169,215,0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#2B2A51',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  inner: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  brand: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
});