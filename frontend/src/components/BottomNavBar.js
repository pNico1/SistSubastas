// src/components/BottomNavBar.js
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const palette = {
  background: '#F9F5FF',
  primary: '#0846ED',
  inactive: '#ABA9D7',
  border: 'rgba(171,169,215,0.3)',
};

const TABS = [
  {
    key: 'Bidster',
    icon: 'home',
    iconActive: 'home',
  },
  {
    key: 'Pujas',
    icon: 'gavel',
    iconActive: 'gavel',
  },
  {
    key: 'OfrecerBien',
    icon: 'add-circle-outline',
    iconActive: 'add-circle',
  },
  {
    key: 'Perfil',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

export default function BottomNavBar({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Obtiene la pantalla actual
  const currentRoute =
    navigation.getState()?.routes?.[navigation.getState().index]?.name;

  // Sin sesion, explorar (Bidster/Pujas) esta permitido; ofrecer y perfil piden login.
  const GUEST_BLOCKED = ['OfrecerBien', 'Perfil'];

  const handlePress = (tab) => {
    if (!user && GUEST_BLOCKED.includes(tab.key)) {
      if (currentRoute !== 'Login') navigation.navigate('Login');
      return;
    }
    if (currentRoute !== tab.key) {
      navigation.navigate(tab.key);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 4 },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = currentRoute === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => handlePress(tab)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isActive ? tab.iconActive : tab.icon}
              size={isActive ? 28 : 25}
              color={
                isActive
                  ? palette.primary
                  : palette.inactive
              }
            />

            {isActive && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,

    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    backgroundColor: palette.background,

    borderTopWidth: 1,
    borderTopColor: palette.border,

    paddingTop: 10,

    shadowColor: '#2B2A51',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.primary,
  },
});
