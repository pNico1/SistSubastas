import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const palette = {
  background: '#F9F5FF',
  surface: '#FFFFFF',
  field: '#F5F2FF',
  primary: '#2357FF',
  text: '#2B2A51',
  muted: '#8B88A8',
  border: '#ECE8FF',
};

const options = [
  {
    id: 'bank',
    route: 'BankAccountStep1',
    icon: 'B',
    title: 'Cuenta Bancaria',
    subtitle: 'Nacional o Extranjera',
  },
  {
    id: 'card',
    route: 'CreditCardPayment',
    icon: 'C',
    title: 'Tarjeta de Credito',
    subtitle: 'Visa, Mastercard, etc.',
  },
  {
    id: 'check',
    route: 'CheckPayment',
    icon: 'Q',
    title: 'Cheque Certificado',
    subtitle: 'Entrega previa verificacion',
  },
];

export default function PaymentMethodScreen({ route, navigation }) {
  const { finishPaymentSetup } = useAuth();
  const fromPaymentMethods = route?.params?.from === 'PaymentMethods';

  function goBack() {
    if (fromPaymentMethods && navigation?.canGoBack()) {
      navigation.goBack();
      return;
    }
    finishPaymentSetup();
  }

  function openMethod(routeName) {
    navigation.navigate(routeName, { from: route?.params?.from });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={goBack} style={styles.backButton} hitSlop={10}>
            <Text style={styles.backArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Method</Text>
          <View style={{ width: 34 }} />
        </View>

        <Text style={styles.title}>Metodo de Pago</Text>
        <Text style={styles.subtitle}>
          Para participar en las subastas, debes registrar al menos un medio de pago verificado.
        </Text>

        <View style={styles.options}>
          {options.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.86}
              onPress={() => openMethod(item.route)}
              style={styles.optionCard}
            >
              <View style={styles.optionIconWrap}>
                <Text style={styles.optionIcon}>{item.icon}</Text>
              </View>
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>{item.title}</Text>
                <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>{'>'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.9} onPress={goBack} style={styles.button}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: palette.primary,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '900',
  },
  headerTitle: { color: palette.text, fontSize: 13, fontWeight: '900' },
  title: {
    color: palette.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    maxWidth: 320,
    marginBottom: 34,
  },
  options: { gap: 14 },
  optionCard: {
    minHeight: 76,
    borderRadius: 13,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#756FD8',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  optionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: palette.field,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  optionIcon: { color: palette.primary, fontSize: 17, fontWeight: '900' },
  optionBody: { flex: 1, minWidth: 0 },
  optionTitle: { color: palette.text, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  optionSubtitle: { color: palette.muted, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  chevron: { color: '#C8C2E6', fontSize: 22, fontWeight: '900', marginLeft: 10 },
  button: {
    height: 60,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    shadowColor: palette.primary,
    shadowOpacity: 0.33,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
