import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import RegisterSuccessScreen from './src/screens/RegisterSuccessScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
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
import NotificacionesScreen from './src/screens/NotificacionesScreen';
import MisProductosScreen from './src/screens/MisProductosScreen';
import ProductoDetailScreen from './src/screens/ProductoDetailScreen';
import MotivoRechazoScreen from './src/screens/MotivoRechazoScreen';
import AceptarTerminosScreen from './src/screens/AceptarTerminosScreen';
import DevolucionScreen from './src/screens/DevolucionScreen';
import UpgradeSeguroScreen from './src/screens/UpgradeSeguroScreen';
// ---- Área 3: perfil y métricas ----
import EditarPerfilScreen from './src/screens/EditarPerfilScreen';
import MetricasScreen from './src/screens/MetricasScreen';
import HistorialSubastasScreen from './src/screens/HistorialSubastasScreen';
// ---- fin Área 3 ----
import { colors } from './src/theme';
import BidsterScreen from './src/screens/BidsterScreen';
import PujasScreen from './src/screens/PujasScreen';
import { navigationRef } from './src/navigationRef';
import { goBackOrReturnTo, navigateWithReturnTo } from './src/navigationUtils';

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

function HeaderBackButton({ navigation, route }) {
  return (
    <TouchableOpacity
      onPress={() => goBackOrReturnTo(navigation, route)}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
    >
      <MaterialIcons name="arrow-back" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

function HeaderRightActions({ navigation }) {
  const { user, logout } = useAuth();
  const pendingVerification = user?.estado === 'pending_verification';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {!pendingVerification ? (
        <TouchableOpacity onPress={() => navigateWithReturnTo(navigation, 'OfrecerBien')} style={{ marginRight: 16 }}>
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
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={navHeader}>
        {!user ? (
          <>
            <Stack.Screen name="Bidster" component={BidsterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Pujas" component={PujasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : needsPassword ? (
          <>
            <Stack.Screen name="AccountVerified" component={AccountVerifiedScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RegisterComplete" component={RegisterCompleteScreen} options={{ headerShown: false }} />
          </>
        ) : needsPaymentSetup ? (
          <>
            <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BankAccountStep1" component={BankAccountStep1Screen} options={{ headerShown: false }} />
            <Stack.Screen name="BankAccountStep2" component={BankAccountStep2Screen} options={{ headerShown: false }} />
            <Stack.Screen name="CreditCardPayment" component={CreditCardPaymentScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CheckPayment" component={CheckPaymentScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Bidster" component={BidsterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Pujas" component={PujasScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Subastas"
              component={SubastasListScreen}
              options={({ navigation }) => ({
                title: 'Subastas abiertas',
                headerRight: () => <HeaderRightActions navigation={navigation} />,
                headerLeft: () => (
                  <TouchableOpacity onPress={() => navigateWithReturnTo(navigation, 'Perfil')}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Mi cuenta</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="SubastaDetail"
              component={SubastaDetailScreen}
              options={({ navigation, route }) => ({
                title: 'Detalle de subasta',
                headerLeft: () => <HeaderBackButton navigation={navigation} route={route} />,
              })}
            />
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={({ navigation, route }) => ({
                title: 'Pujar',
                headerLeft: () => <HeaderBackButton navigation={navigation} route={route} />,
              })}
            />
            <Stack.Screen
              name="Perfil"
              component={PerfilScreen}
              options={({ navigation, route }) => ({
                title: 'Mi cuenta',
                headerLeft: () => <HeaderBackButton navigation={navigation} route={route} />,
              })}
            />

            {/* Notificaciones */}
            <Stack.Screen
              name="Notificaciones"
              component={NotificacionesScreen}
              options={{ headerShown: false }}
            />

            {/* Área 3: perfil, historial y métricas */}
            <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Metricas" component={MetricasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="HistorialSubastas" component={HistorialSubastasScreen} options={{ headerShown: false }} />

            {/* Área 2: dueño / producto / revisión / seguros */}
            <Stack.Screen name="MisProductos" component={MisProductosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProductoDetail" component={ProductoDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MotivoRechazo" component={MotivoRechazoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AceptarTerminos" component={AceptarTerminosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Devolucion" component={DevolucionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UpgradeSeguro" component={UpgradeSeguroScreen} options={{ headerShown: false }} />

            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BankAccountStep1" component={BankAccountStep1Screen} options={{ headerShown: false }} />
            <Stack.Screen name="BankAccountStep2" component={BankAccountStep2Screen} options={{ headerShown: false }} />
            <Stack.Screen name="CreditCardPayment" component={CreditCardPaymentScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CheckPayment" component={CheckPaymentScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="OfrecerBien"
              component={OfrecerBienScreen}
              options={({ navigation, route }) => ({
                title: 'Ofrecer un bien',
                headerLeft: () => <HeaderBackButton navigation={navigation} route={route} />,
              })}
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
