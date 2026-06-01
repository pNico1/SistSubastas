import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

// Selector reutilizable (label + campo que abre un modal con lista buscable).
// Sin dependencias extra: usa Modal y FlatList de react-native.
//
// Props:
//   label, placeholder, error, loading
//   items: [{ label, value }]
//   value: el value seleccionado (o null)
//   onSelect: (value) => void
export default function PickerField({
  label,
  placeholder = 'Seleccionar...',
  error,
  loading = false,
  items = [],
  value = null,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => items.find((it) => String(it.value) === String(value)) || null,
    [items, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q));
  }, [items, query]);

  function choose(val) {
    onSelect?.(val);
    setOpen(false);
    setQuery('');
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[styles.field, error && styles.fieldError]}
        onPress={() => !loading && setOpen(true)}
        activeOpacity={0.7}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : (
          <Text style={selected ? styles.valueText : styles.placeholderText}>
            {selected ? selected.label : placeholder}
          </Text>
        )}
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || 'Seleccionar'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.close}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.search}
              placeholder="Buscar..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />

            <FlatList
              data={filtered}
              keyExtractor={(it) => String(it.value)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>No hay resultados</Text>
              }
              renderItem={({ item }) => {
                const isSel = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    style={[styles.option, isSel && styles.optionSelected]}
                    onPress={() => choose(item.value)}
                  >
                    <Text style={[styles.optionText, isSel && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSel ? <Text style={styles.check}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs, color: colors.text, fontWeight: '600' },
  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: { borderColor: colors.danger },
  valueText: { fontSize: 16, color: colors.text },
  placeholderText: { fontSize: 16, color: colors.textMuted },
  chevron: { color: colors.textMuted, fontSize: 16, marginLeft: spacing.sm },
  error: { color: colors.danger, marginTop: spacing.xs, fontSize: 13 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    maxHeight: '75%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  close: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: '#EEF1FB' },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { fontWeight: '700', color: colors.primary },
  check: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.lg },
});
