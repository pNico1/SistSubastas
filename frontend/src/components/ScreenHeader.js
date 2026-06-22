import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import { goBackOrReturnTo, navigateWithReturnTo } from '../navigationUtils';

const palette = {
  background: '#F9F5FF',
  primary: '#0846ED',
  field: '#DCD9FF',
  border: 'rgba(171,169,215,0.3)',
  danger: '#B41340',
  text: '#2B2A51',
  white: '#FFFFFF',
};

function useUnreadNotifications(enabled) {
  const [noLeidas, setNoLeidas] = useState(0);

  const cargarNotificaciones = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await clienteApi.notificaciones();
      setNoLeidas((data || []).filter((n) => !n.leido).length);
    } catch {
      setNoLeidas(0);
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones();
    }, [cargarNotificaciones])
  );

  return noLeidas;
}

export default function ScreenHeader({
  navigation,
  route,
  title,
  showBack = true,
  showNotifications = true,
  onBackPress,
}) {
  const insets = useSafeAreaInsets();
  const noLeidas = useUnreadNotifications(showNotifications);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    goBackOrReturnTo(navigation, route);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={22} color={palette.primary} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.brand}>BIDSTER</Text>
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {showNotifications ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigateWithReturnTo(navigation, 'Notificaciones')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
            activeOpacity={0.7}
          >
            <MaterialIcons name="notifications-none" size={22} color={palette.primary} />
            {noLeidas > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{noLeidas > 9 ? '9+' : noLeidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.rightSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    ...Platform.select({
      ios: {
        shadowColor: palette.text,
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
    paddingHorizontal: 20,
    gap: 12,
  },
  brand: {
    width: 44,
    color: palette.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.field,
  },
  rightSpacer: {
    width: 38,
    height: 38,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: palette.white,
  },
  badgeText: {
    color: palette.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
