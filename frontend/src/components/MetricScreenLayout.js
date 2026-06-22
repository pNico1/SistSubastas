import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenHeader from './ScreenHeader';

export const metricPalette = {
  bg: '#F9F5FF',
  surface: '#FFFFFF',
  low: '#F2EFFF',
  primary: '#0846ED',
  primaryFaint: 'rgba(8,70,237,0.10)',
  tertiary: '#913983',
  tertiaryFaint: 'rgba(145,57,131,0.10)',
  success: '#16A34A',
  successFaint: '#E7F6EC',
  warning: '#D97706',
  warningFaint: 'rgba(217,119,6,0.12)',
  text: '#2B2A51',
  muted: '#585781',
  border: 'rgba(171,169,215,0.35)',
  white: '#FFFFFF',
};

export function money(value, currency = 'ARS') {
  const n = Number(value || 0);
  return `${currency} ${Number.isFinite(n) ? n.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) : '0,00'}`;
}

export function compactMoney(value, currency = 'ARS') {
  const n = Number(value || 0);
  const formatted = Number.isFinite(n) ? n.toLocaleString('es-AR', {
    maximumFractionDigits: 0,
  }) : '0';
  return `${currency} ${formatted}`;
}

export function moneyMap(values = {}) {
  const entries = Object.entries(values || {});
  if (!entries.length) return money(0);
  return entries.map(([currency, value]) => money(value, currency)).join('  ');
}

export function MetricScreen({ navigation, route, title, refreshing, onRefresh, children }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader
        navigation={navigation}
        route={route}
        title={title}
        onBackPress={() => navigation.navigate('Perfil')}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function MetricHero({ icon, eyebrow, title, value, tone = 'primary' }) {
  const color = metricPalette[tone] || metricPalette.primary;
  const bg = metricPalette[`${tone}Faint`] || metricPalette.primaryFaint;

  return (
    <View style={styles.hero}>
      <View style={[styles.heroIcon, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      {value != null ? <Text style={[styles.heroValue, { color }]}>{value}</Text> : null}
    </View>
  );
}

export function SummaryCard({ children }) {
  return <View style={styles.summaryCard}>{children}</View>;
}

export function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function MetricRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function MetricTag({ label, tone = 'primary' }) {
  const color = metricPalette[tone] || metricPalette.primary;
  const bg = metricPalette[`${tone}Faint`] || metricPalette.primaryFaint;
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function MetricItem({ children }) {
  return <View style={styles.item}>{children}</View>;
}

export function ViewAllButton({ expanded, total, onPress }) {
  if (total <= 3) return null;
  return (
    <TouchableOpacity style={styles.viewAllButton} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.viewAllText}>{expanded ? 'Ver menos' : 'Ver todas'}</Text>
      <MaterialIcons name={expanded ? 'expand-less' : 'chevron-right'} size={18} color={metricPalette.primary} />
    </TouchableOpacity>
  );
}

export function EmptyMetric({ icon, title, text }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={icon} size={24} color={metricPalette.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function CategoryBreakdown({ values = {} }) {
  const entries = Object.entries(values || {});
  if (!entries.length) return null;

  return (
    <Section title="Por categoria">
      {entries.map(([name, value]) => (
        <MetricRow key={name} label={String(name).replace(/_/g, ' ')} value={value} />
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: metricPalette.bg },
  body: { padding: 20, paddingBottom: 40 },
  hero: {
    marginBottom: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  eyebrow: {
    color: metricPalette.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    color: metricPalette.text,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '900',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: metricPalette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: metricPalette.border,
    padding: 18,
    marginBottom: 14,
  },
  section: {
    backgroundColor: metricPalette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: metricPalette.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: metricPalette.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 8,
  },
  rowLabel: {
    flex: 1,
    color: metricPalette.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  rowValue: {
    flexShrink: 1,
    color: metricPalette.text,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  item: {
    borderTopWidth: 1,
    borderTopColor: metricPalette.border,
    paddingTop: 12,
    marginTop: 12,
  },
  viewAllButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: metricPalette.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
    backgroundColor: metricPalette.surface,
  },
  viewAllText: {
    color: metricPalette.primary,
    fontWeight: '900',
    fontSize: 13,
  },
  empty: {
    backgroundColor: metricPalette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: metricPalette.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: metricPalette.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: metricPalette.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyText: {
    color: metricPalette.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
