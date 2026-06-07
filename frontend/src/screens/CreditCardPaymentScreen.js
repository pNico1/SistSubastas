import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clienteApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { colors, radius, spacing } from '../theme';

export default function CreditCardPaymentScreen({ route, navigation }) {
  const { finishPaymentSetup } = useAuth();
  const from = route?.params?.from;
  const [form, setForm] = useState({
    titular: '',
    numero: '',
    vencimiento: '',
    codigoSeguridad: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const numeroDigits = form.numero.replace(/\D/g, '');
  const marca = useMemo(() => detectBrand(numeroDigits), [numeroDigits]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  }

  function validate() {
    const next = {};
    if (!form.titular.trim()) next.titular = 'Ingresa el titular';
    if (numeroDigits.length < 12 || numeroDigits.length > 19) next.numero = 'Numero de tarjeta invalido';
    if (!/^\d{2}\/\d{2}$/.test(form.vencimiento.trim())) next.vencimiento = 'Usa formato MM/AA';
    if (!/^\d{3,4}$/.test(form.codigoSeguridad.trim())) next.codigoSeguridad = 'CVV/CVC invalido';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await clienteApi.crearMetodoPago({
        tipo: 'tarjeta',
        marca,
        titular: form.titular.trim(),
        numero: numeroDigits,
        vencimiento: form.vencimiento.trim(),
        codigoSeguridad: form.codigoSeguridad.trim(),
        moneda: 'ARS',
        esInternacional: false,
      });
      finish('Tarjeta agregada', 'El medio de pago quedo pendiente de verificacion.');
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  function finish(title, message) {
    Alert.alert(title, message, [{ text: 'OK', onPress: goDone }]);
  }

  async function goDone() {
    if (from === 'PaymentMethods') {
      navigation.navigate('PaymentMethods');
      return;
    }
    await finishPaymentSetup();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>PAGO CON TARJETA</Text>

        <TextField label="Titular" value={form.titular} onChangeText={(v) => setField('titular', v)} error={errors.titular} />
        <TextField label="N de tarjeta" value={form.numero} onChangeText={(v) => setField('numero', v)} keyboardType="number-pad" error={errors.numero} />
        <TextField label="MM/AA" value={form.vencimiento} onChangeText={(v) => setField('vencimiento', formatExpiry(v))} keyboardType="number-pad" error={errors.vencimiento} />
        <TextField label="CVV/CVC" value={form.codigoSeguridad} onChangeText={(v) => setField('codigoSeguridad', v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry error={errors.codigoSeguridad} />

        <View style={styles.previewCard}>
          <Text style={styles.previewBrand}>{marca}</Text>
          <Text style={styles.previewNumber}>**{numeroDigits.slice(-3) || '321'}</Text>
        </View>

        <View style={styles.footer}>
          <Button title="Finalizar" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function detectBrand(numero) {
  if (numero.startsWith('4')) return 'VISA';
  if (numero.startsWith('5') || numero.startsWith('2')) return 'MASTERCARD';
  if (numero.startsWith('34') || numero.startsWith('37')) return 'AMEX';
  return 'TARJETA';
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function BackButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.backButton} hitSlop={10}>
      <Text style={styles.backArrow}>{'<'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, padding: spacing.lg },
  backButton: {
    width: 42,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  backArrow: { color: colors.text, fontSize: 22, lineHeight: 24, fontWeight: '800' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: spacing.lg },
  previewCard: {
    minHeight: 76,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  previewBrand: { color: colors.text, fontSize: 18, fontWeight: '800' },
  previewNumber: { color: colors.text, fontSize: 18, fontWeight: '800', alignSelf: 'flex-end', marginTop: spacing.xs },
  footer: { marginTop: 'auto', alignSelf: 'flex-end', minWidth: 140 },
});
