import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import { clienteApi } from '../api/endpoints';

const p={bg:'#F9F5FF',surface:'#FFF',primary:'#0846ED',text:'#2B2A51',muted:'#585781',border:'rgba(171,169,215,.35)'};
export default function CuentaCobroScreen({navigation,route}){
 const [form,setForm]=useState({titular:'',banco:'',identificadorBancario:'',moneda:'ARS',pais:'Argentina',exterior:false}); const [actual,setActual]=useState(null); const [saving,setSaving]=useState(false);
 const load=useCallback(()=>clienteApi.cuentasCobro().then(x=>setActual((x||[]).find(c=>c.estado==='activa')||null)).catch(()=>{}),[]); useFocusEffect(useCallback(()=>{load();},[load]));
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 async function save(){if(!form.titular.trim()||!form.banco.trim()||!form.identificadorBancario.trim())return Alert.alert('Faltan datos','Completá titular, banco y CBU/CVU/IBAN.');setSaving(true);try{const c=await clienteApi.guardarCuentaCobro(form);setActual(c);Alert.alert('Cuenta guardada','Se usará para cobrar tus próximas ventas.');}catch(e){Alert.alert('No se pudo guardar',e?.response?.data?.message||e.message);}finally{setSaving(false)}}
 return <View style={s.screen}><ScreenHeader navigation={navigation} route={route} title="Cuenta de cobro"/><ScrollView contentContainerStyle={s.body}>
  {actual?<View style={s.card}><Text style={s.cardTitle}>Cuenta activa</Text><Text style={s.value}>{actual.banco} ····{actual.identificadorBancario.slice(-4)}</Text><Text style={s.meta}>{actual.moneda} · {actual.pais}{actual.exterior?' · Exterior':''}</Text></View>:<Text style={s.intro}>Declarà la cuenta a la vista donde querés recibir el dinero de tus piezas vendidas.</Text>}
  <Field label="Titular" value={form.titular} onChangeText={v=>set('titular',v)}/><Field label="Banco" value={form.banco} onChangeText={v=>set('banco',v)}/><Field label="CBU, CVU o IBAN" value={form.identificadorBancario} onChangeText={v=>set('identificadorBancario',v)}/><Field label="País" value={form.pais} onChangeText={v=>set('pais',v)}/>
  <Text style={s.label}>MONEDA</Text><View style={s.options}>{['ARS','USD'].map(m=><TouchableOpacity key={m} style={[s.option,form.moneda===m&&s.selected]} onPress={()=>set('moneda',m)}><Text style={[s.optionText,form.moneda===m&&{color:p.primary}]}>{m}</Text></TouchableOpacity>)}</View>
  <View style={s.switchRow}><Text style={s.value}>Cuenta del exterior</Text><Switch value={form.exterior} onValueChange={v=>set('exterior',v)} trackColor={{true:p.primary}}/></View>
  <TouchableOpacity style={s.button} onPress={save} disabled={saving}><Text style={s.buttonText}>{saving?'Guardando...':'Guardar cuenta'}</Text></TouchableOpacity>
 </ScrollView></View>;
}
function Field({label,...props}){return <View style={{width:'100%',marginBottom:14}}><Text style={s.label}>{label.toUpperCase()}</Text><TextInput style={s.input} placeholderTextColor={p.muted} {...props}/></View>}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:p.bg},body:{padding:20,paddingBottom:40},intro:{color:p.muted,lineHeight:20,marginBottom:18},card:{backgroundColor:p.surface,borderWidth:1,borderColor:p.border,borderRadius:16,padding:16,marginBottom:20},cardTitle:{color:p.primary,fontWeight:'900',fontSize:12},value:{color:p.text,fontWeight:'800',fontSize:15,marginTop:5},meta:{color:p.muted,fontSize:12,marginTop:4},label:{color:p.muted,fontSize:10,fontWeight:'900',letterSpacing:1,marginBottom:7},input:{backgroundColor:p.surface,borderWidth:1,borderColor:p.border,borderRadius:12,padding:13,color:p.text},options:{flexDirection:'row',gap:10,marginBottom:15},option:{flex:1,backgroundColor:p.surface,borderWidth:1,borderColor:p.border,borderRadius:12,padding:13,alignItems:'center'},selected:{borderColor:p.primary,backgroundColor:'rgba(8,70,237,.08)'},optionText:{color:p.text,fontWeight:'900'},switchRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},button:{minHeight:52,backgroundColor:p.primary,borderRadius:14,alignItems:'center',justifyContent:'center'},buttonText:{color:'#FFF',fontWeight:'900'}});
