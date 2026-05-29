import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export default function Button({ title, onPress, loading, disabled, variant = 'primary' }) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'danger' ? colors.danger :
    variant === 'accent' ? colors.accent : colors.primary;
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg }, isDisabled && styles.disabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
