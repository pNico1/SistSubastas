import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

// Checkbox con etiqueta. La etiqueta puede ser texto o un nodo (para links).
export default function Checkbox({ checked, onChange, children, error }) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => onChange(!checked)}
    >
      <View style={[styles.box, checked && styles.boxOn, error && !checked && styles.boxError]}>
        {checked ? <Text style={styles.tick}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? <Text style={styles.label}>{children}</Text> : children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  box: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CFC8F5',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1,
  },
  boxOn: { backgroundColor: '#0B64ED', borderColor: '#0B64ED' },
  boxError: { borderColor: '#FF748D' },
  tick: { color: '#fff', fontSize: 14, fontWeight: '900' },
  label: { color: '#2B2A51', fontSize: 14, lineHeight: 20 },
});
