import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clienteApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { colors, spacing } from '../theme';

export default function CheckPaymentScreen({ route, navigation }) {
  const { finishPaymentSetup } = useAuth();
  const from = route?.params?.from;
  const [form, setForm] = useState({
    banco: '',
    numero: '',
    sucursal: '',
    fechaEmision: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  }

  function validate() {
    const next = {};
    if (!form.banco.trim()) next.banco = 'Ingresa el banco emisor';
    if (!form.numero.trim()) next.numero = 'Ingresa el numero de cheque';
    if (!form.sucursal.trim()) next.sucursal = 'Ingresa la sucursal';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(form.fechaEmision.trim())) {
      next.fechaEmision = 'Usa formato DD/MM/AAAA';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await clienteApi.crearMetodoPago({
        tipo: 'cheque',
        banco: form.banco.trim(),
        numero: form.numero.trim(),
        sucursal: form.sucursal.trim(),
        fechaEmision: form.fechaEmision.trim(),
        moneda: 'ARS',
      });
      Alert.alert('Cheque agregado', 'El medio de pago quedo pendiente de verificacion.', [
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
        <Text style={styles.title}>CHEQUE</Text>

        <TextField label="Banco emisor" value={form.banco} onChangeText={(v) => setField('banco', v)} error={errors.banco} />
        <TextField label="N de cheque" value={form.numero} onChangeText={(v) => setField('numero', v)} keyboardType="number-pad" error={errors.numero} />
        <TextField label="Sucursal" value={form.sucursal} onChangeText={(v) => setField('sucursal', v)} error={errors.sucursal} />
        <TextField label="Fecha emision" value={form.fechaEmision} onChangeText={(v) => setField('fechaEmision', formatDate(v))} keyboardType="number-pad" error={errors.fechaEmision} />

        <View style={styles.footer}>
          <Button title="Finalizar" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
  title: { color: colors.text, fontSize: 26, fontWeight: '800', alignSelf: 'center', marginBottom: spacing.lg },
  footer: { marginTop: 'auto', alignSelf: 'flex-end', minWidth: 140 },
});
