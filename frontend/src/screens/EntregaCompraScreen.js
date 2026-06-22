import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { adquisicionesApi, clienteApi } from '../api/endpoints';
import Loading from '../components/Loading';
import ErrorView from '../components/ErrorView';
import { goBackOrReturnTo } from '../navigationUtils';

const p = { background: '#F9F5FF', surface: '#FFF', surfaceLow: '#F2EFFF', primary: '#0846ED', primaryFaint: 'rgba(8,70,237,.10)', text: '#2B2A51', muted: '#585781', border: 'rgba(171,169,215,.35)', warning: '#B45309', warningFaint: '#FEF3C7' };

export default function EntregaCompraScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const [adq, setAdq] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [compra, perfil] = await Promise.all([adquisicionesApi.getById(id), clienteApi.perfil()]);
      setAdq(compra);
      setDireccion(perfil?.direccion || '');
      if (compra.entregaDefinida) navigation.replace('PagoAdquisicion', { id });
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [id, navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function continuar() {
    if (!tipo) return Alert.alert('Elegí una opción', 'Indicá cómo querés recibir la pieza.');
    if (tipo === 'envio' && !direccion.trim()) return Alert.alert('Falta la dirección', 'Ingresá el domicilio de entrega.');
    setSaving(true);
    try {
      if (tipo === 'envio') await adquisicionesApi.seleccionarEnvio(id, direccion.trim());
      else await adquisicionesApi.seleccionarRetiro(id);
      navigation.replace('PagoAdquisicion', { id });
    } catch (e) {
      Alert.alert('No se pudo guardar', e?.response?.data?.message || e.message || 'Intentá nuevamente.');
    } finally { setSaving(false); }
  }

  if (loading) return <Loading text="Preparando tu compra..." />;
  if (error) return <ErrorView error={error} onRetry={() => { setLoading(true); load(); }} />;

  return <View style={styles.screen}>
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={() => goBackOrReturnTo(navigation, route)} style={styles.back}><MaterialIcons name="arrow-back" size={22} color={p.text} /></TouchableOpacity>
      <Text style={styles.headerTitle}>Cómo recibir tu compra</Text><View style={{ width: 36 }} />
    </View>
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.win}><MaterialIcons name="emoji-events" size={36} color="#C58B00" /></View>
      <Text style={styles.title}>¡Ganaste la puja!</Text>
      <Text style={styles.product}>{adq.producto || `Producto #${adq.productoId}`}</Text>
      <Text style={styles.intro}>Elegí una modalidad antes de realizar el pago.</Text>

      <Option selected={tipo === 'envio'} icon="local-shipping" title="Enviar a domicilio" text="El envío está a tu cargo y se agregará a la factura." onPress={() => setTipo('envio')} />
      {tipo === 'envio' ? <View style={styles.addressBox}>
        <Text style={styles.label}>DIRECCIÓN DE ENTREGA</Text>
        <TextInput value={direccion} onChangeText={setDireccion} multiline style={styles.input} placeholder="Calle, número, localidad y provincia" placeholderTextColor={p.muted} />
        <Text style={styles.hint}>Podés usar o corregir la dirección declarada en tu perfil.</Text>
      </View> : null}

      <Option selected={tipo === 'retiro'} icon="storefront" title="Retirar personalmente" text="Coordinaremos el retiro en el depósito de la empresa." onPress={() => setTipo('retiro')} />
      {tipo === 'retiro' ? <View style={styles.warning}><MaterialIcons name="shield" size={20} color={p.warning} /><Text style={styles.warningText}>Al retirar personalmente la pieza, la cobertura del seguro finaliza en el momento de la entrega.</Text></View> : null}

      <TouchableOpacity style={[styles.button, (!tipo || saving) && { opacity: .55 }]} disabled={!tipo || saving} onPress={continuar}>
        <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Continuar al pago'}</Text><MaterialIcons name="arrow-forward" size={19} color="#FFF" />
      </TouchableOpacity>
    </ScrollView>
  </View>;
}

function Option({ selected, icon, title, text, onPress }) {
  return <TouchableOpacity style={[styles.option, selected && styles.optionSelected]} onPress={onPress} activeOpacity={.85}>
    <View style={styles.optionIcon}><MaterialIcons name={icon} size={25} color={p.primary} /></View>
    <View style={{ flex: 1 }}><Text style={styles.optionTitle}>{title}</Text><Text style={styles.optionText}>{text}</Text></View>
    <MaterialIcons name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={23} color={selected ? p.primary : p.muted} />
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: p.background }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, backgroundColor: p.surface, borderBottomWidth: 1, borderBottomColor: p.border }, back: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surfaceLow, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: p.text, fontSize: 16, fontWeight: '800' }, body: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  win: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF5D6', alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 24, fontWeight: '900', color: p.text, marginTop: 13 }, product: { color: p.primary, fontSize: 14, fontWeight: '800', marginTop: 5, textAlign: 'center' }, intro: { color: p.muted, fontSize: 13, marginTop: 8, marginBottom: 18 },
  option: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: p.surface, borderWidth: 1.5, borderColor: p.border, borderRadius: 15, padding: 15, marginBottom: 10 }, optionSelected: { borderColor: p.primary, backgroundColor: p.primaryFaint }, optionIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: p.primaryFaint, alignItems: 'center', justifyContent: 'center' }, optionTitle: { color: p.text, fontSize: 15, fontWeight: '900' }, optionText: { color: p.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  addressBox: { width: '100%', backgroundColor: p.surface, padding: 14, borderRadius: 13, marginBottom: 11 }, label: { color: p.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, input: { minHeight: 72, color: p.text, fontSize: 14, borderWidth: 1, borderColor: p.border, borderRadius: 10, padding: 11, marginTop: 7, textAlignVertical: 'top' }, hint: { color: p.muted, fontSize: 11, marginTop: 6 }, warning: { width: '100%', flexDirection: 'row', gap: 9, backgroundColor: p.warningFaint, borderRadius: 12, padding: 13, marginBottom: 11 }, warningText: { flex: 1, color: p.warning, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  button: { width: '100%', minHeight: 54, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: p.primary, borderRadius: 14, marginTop: 10 }, buttonText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
