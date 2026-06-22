import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clienteApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { colors, spacing } from '../theme';

export default function BankAccountStep2Screen({ route, navigation }) {
  const { finishPaymentSetup } = useAuth();
  const from = route?.params?.from;
  const draft = route?.params?.draft || {};
  const [form, setForm] = useState({
    documento: '',
    email: '',
    telefono: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  }

  function validate() {
    const next = {};
    if (!form.documento.trim()) next.documento = 'Ingresa DNI, CUIT o CUIL';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) next.email = 'Email invalido';
    if (!form.telefono.trim()) next.telefono = 'Ingresa el telefono';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await clienteApi.crearMetodoPago({
        tipo: 'cuenta_bancaria',
        titular: draft.titular,
        cbu: draft.cbu,
        banco: draft.banco,
        tipoCuenta: draft.tipoCuenta,
        moneda: draft.moneda || 'ARS',
        documento: form.documento.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        esInternacional: draft.moneda === 'USD',
      });
      Alert.alert('Cuenta agregada', 'El medio de pago quedo pendiente de verificacion.', [
        { text: 'OK', onPress: goDone },
      ]);
    } catch (err) {
      Alert.alert('No se pudo guardar', err.message || 'Error');
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.title}>CUENTA BANCARIA</Text>
        <Text style={styles.section}>Datos</Text>

        <TextField label="DNI/CUIT/CUIL" value={form.documento} onChangeText={(v) => setField('documento', v)} keyboardType="number-pad" error={errors.documento} />
        <TextField label="Email" value={form.email} onChangeText={(v) => setField('email', v)} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <TextField label="Telefono" value={form.telefono} onChangeText={(v) => setField('telefono', v)} keyboardType="phone-pad" error={errors.telefono} />

        <View style={styles.footer}>
          <Button title="Finalizar" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  title: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.lg },
  section: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.md },
  footer: { marginTop: 'auto', alignSelf: 'flex-end', minWidth: 140 },
});
