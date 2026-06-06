import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import RegisterSuccessScreen from './src/screens/RegisterSuccessScreen';
import RegisterCompleteScreen from './src/screens/RegisterCompleteScreen';
import SubastasListScreen from './src/screens/SubastasListScreen';
import SubastaDetailScreen from './src/screens/SubastaDetailScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import OfrecerBienScreen from './src/screens/OfrecerBienScreen';
import { colors } from './src/theme';
import BidsterScreen from './src/screens/BidsterScreen';
const Stack = createNativeStackNavigator();

const navHeader = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout}>
      <Text style={{ color: '#fff', fontWeight: '600' }}>Salir</Text>
    </TouchableOpacity>
  );
}

// Acciones del header de Subastas: ofrecer un bien + salir.
function HeaderRightActions({ navigation }) {
  const { logout } = useAuth();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity onPress={() => navigation.navigate('OfrecerBien')} style={{ marginRight: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Ofrecer</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={logout}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootNavigator() {
  const { user, booting } = useAuth();

  if (booting) return <SplashScreen />;
  const pendingVerification = user?.estado === 'pending_verification';
  const needsPassword = user?.estado === 'registration_incomplete' || user?.estado === 'approved';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={navHeader}>
        {!user ? (
          <>
            <Stack.Screen name="Bidster" component={BidsterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterSuccess"
              component={RegisterSuccessScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : pendingVerification ? (
          <Stack.Screen
            name="RegisterSuccess"
            component={RegisterSuccessScreen}
            options={{ headerShown: false }}
          />
        ) : needsPassword ? (
          <Stack.Screen
            name="RegisterComplete"
            component={RegisterCompleteScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Subastas"
              component={SubastasListScreen}
              options={({ navigation }) => ({
                title: 'Subastas abiertas',
                headerRight: () => <HeaderRightActions navigation={navigation} />,
                headerLeft: () => (
                  <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Mi cuenta</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="SubastaDetail"
              component={SubastaDetailScreen}
              options={{ title: 'Detalle de subasta' }}
            />
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={{ title: 'Pujar' }}
            />
            <Stack.Screen
              name="Perfil"
              component={PerfilScreen}
              options={{ title: 'Mi cuenta' }}
            />
            <Stack.Screen
              name="OfrecerBien"
              component={OfrecerBienScreen}
              options={{ title: 'Ofrecer un bien' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
