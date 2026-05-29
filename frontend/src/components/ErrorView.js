import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { colors, spacing } from '../theme';

// Vista de error reutilizable con boton de reintento.
export default function ErrorView({ error, onRetry }) {
  const msg = typeof error === 'string' ? error : error?.message || 'Ocurrio un error';
  const isNetwork = error?.isNetwork;
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{isNetwork ? '📡' : '⚠️'}</Text>
      <Text style={styles.title}>{isNetwork ? 'Sin conexion' : 'Ups...'}</Text>
      <Text style={styles.msg}>{msg}</Text>
      {onRetry && (
        <View style={styles.btn}>
          <Button title="Reintentar" onPress={onRetry} variant="primary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  icon: { fontSize: 40, marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  msg: { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  btn: { width: 180 },
});
