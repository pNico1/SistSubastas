import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import { navigateWithReturnTo } from '../navigationUtils';
import { useAuth } from '../context/AuthContext';

const palette = {
  background: '#F9F5FF',
  primary:    '#0846ED',
  field:      '#DCD9FF',
  border:     'rgba(171,169,215,0.3)',
  danger:     '#B41340',
  white:      '#FFFFFF',
};

export default function TopAppBar({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [noLeidas, setNoLeidas] = useState(0);

  const cargarNotificaciones = useCallback(async () => {
    if (!user) {
      setNoLeidas(0);
      return;
    }
    try {
      const data = await clienteApi.notificaciones();
      const pendientes = (data || []).filter((n) => !n.leido).length;
      setNoLeidas(pendientes);
    } catch (err) {
      // si falla, no rompemos el header por esto
    }
  }, [user]);

  const abrirNotificaciones = () => {
    if (user) {
      navigateWithReturnTo(navigation, 'Notificaciones');
      return;
    }
    Alert.alert(
      'Iniciá sesión',
      'Necesitás iniciar sesión para ver tus notificaciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
      ],
    );
  };

  // Recarga el contador cada vez que la pantalla toma foco (volver de notificaciones, etc).
  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones();
    }, [cargarNotificaciones])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Text style={styles.brand}>BIDSTER</Text>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={abrirNotificaciones}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="notifications-none" size={22} color={palette.primary} />
          {noLeidas > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{noLeidas > 9 ? '9+' : noLeidas}</Text>
            </View>
          )}
        </TouchableOpacity>
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
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: palette.field,
  },
  badge: {
    position: 'absolute',
    top: -2, right: -2,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: palette.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: palette.white,
  },
  badgeText: { color: palette.white, fontSize: 9, fontWeight: '800' },
});
