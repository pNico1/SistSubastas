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
import AccountVerifiedScreen from './src/screens/AccountVerifiedScreen';
import RegisterCompleteScreen from './src/screens/RegisterCompleteScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import PaymentMethodScreen from './src/screens/PaymentMethodScreen';
import BankAccountStep1Screen from './src/screens/BankAccountStep1Screen';
import BankAccountStep2Screen from './src/screens/BankAccountStep2Screen';
import CreditCardPaymentScreen from './src/screens/CreditCardPaymentScreen';
import CheckPaymentScreen from './src/screens/CheckPaymentScreen';
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
  const { user, logout } = useAuth();
  const pendingVerification = user?.estado === 'pending_verification';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {!pendingVerification ? (
        <TouchableOpacity onPress={() => navigation.navigate('OfrecerBien')} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Ofrecer</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity onPress={logout}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootNavigator() {
  const { user, booting, paymentSetupPending } = useAuth();

  if (booting) return <SplashScreen />;
  const needsPassword = user?.estado === 'registration_incomplete' || user?.estado === 'approved';
  const needsPaymentSetup = user?.estado === 'active' && paymentSetupPending;

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
        ) : needsPassword ? (
          <>
            <Stack.Screen
              name="AccountVerified"
              component={AccountVerifiedScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RegisterComplete"
              component={RegisterCompleteScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : needsPaymentSetup ? (
          <>
            <Stack.Screen
              name="PaymentMethod"
              component={PaymentMethodScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BankAccountStep1"
              component={BankAccountStep1Screen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BankAccountStep2"
              component={BankAccountStep2Screen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreditCardPayment"
              component={CreditCardPaymentScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CheckPayment"
              component={CheckPaymentScreen}
              options={{ headerShown: false }}
            />
          </>
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
              name="PaymentMethods"
              component={PaymentMethodsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PaymentMethod"
              component={PaymentMethodScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BankAccountStep1"
              component={BankAccountStep1Screen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BankAccountStep2"
              component={BankAccountStep2Screen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreditCardPayment"
              component={CreditCardPaymentScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CheckPayment"
              component={CheckPaymentScreen}
              options={{ headerShown: false }}
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
