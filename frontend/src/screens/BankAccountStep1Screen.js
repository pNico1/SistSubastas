import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from '../components/TextField';
import { colors, radius, spacing } from '../theme';

export default function BankAccountStep1Screen({ route, navigation }) {
  const from = route?.params?.from;
  const [form, setForm] = useState({
    titular: '',
    cbu: '',
    banco: '',
    tipoCuenta: '',
    moneda: 'ARS',
  });
  const [errors, setErrors] = useState({});

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  }

  function validate() {
    const next = {};
    if (!form.titular.trim()) next.titular = 'Ingresa el titular';
    if (!form.cbu.trim()) next.cbu = 'Ingresa CBU, CVU o alias';
    if (!form.banco.trim()) next.banco = 'Ingresa el banco';
    if (!form.tipoCuenta.trim()) next.tipoCuenta = 'Ingresa el tipo de cuenta';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function next() {
    if (!validate()) return;
    navigation.navigate('BankAccountStep2', { from, draft: form });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>CUENTA BANCARIA</Text>
        <Text style={styles.section}>Datos</Text>

        <TextField label="Titular" value={form.titular} onChangeText={(v) => setField('titular', v)} error={errors.titular} />
        <TextField label="CBU/CVU/ALIAS" value={form.cbu} onChangeText={(v) => setField('cbu', v)} error={errors.cbu} />
        <TextField label="Banco" value={form.banco} onChangeText={(v) => setField('banco', v)} error={errors.banco} />
        <TextField label="Tipo de cuenta" value={form.tipoCuenta} onChangeText={(v) => setField('tipoCuenta', v)} error={errors.tipoCuenta} />

        <View style={styles.monedaRow}>
          {['ARS', 'USD'].map((moneda) => (
            <TouchableOpacity
              key={moneda}
              onPress={() => setField('moneda', moneda)}
              style={[styles.monedaButton, form.moneda === moneda && styles.monedaButtonActive]}
            >
              <Text style={[styles.monedaText, form.moneda === moneda && styles.monedaTextActive]}>{moneda}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={next} style={styles.nextButton}>
            <Text style={styles.nextText}>{'>'}</Text>
          </TouchableOpacity>
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
  monedaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  monedaButton: {
    minWidth: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  monedaButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monedaText: { color: colors.text, fontWeight: '700' },
  monedaTextActive: { color: '#FFFFFF' },
  footer: { marginTop: 'auto', alignItems: 'flex-end' },
  nextButton: {
    width: 48,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
