// Componentes y utilidades compartidas por las pantallas de estadísticas.
// Mantiene la estética del resto de la app (paleta violeta, MaterialIcons),
// agregando profundidad háptica: tarjetas anidadas, sombras difusas y
// animaciones de entrada con física fluida.
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { goBackOrReturnTo } from '../navigationUtils';

export const p = {
  background:    '#F9F5FF',
  surface:       '#FFFFFF',
  surfaceLow:    '#F2EFFF',
  container:     '#E9E5FF',
  containerHigh: '#E2DFFF',
  primary:       '#0846ED',
  primaryFaint:  'rgba(8,70,237,0.10)',
  secondary:     '#514EB6',
  secondaryFaint:'rgba(81,78,182,0.12)',
  tertiary:      '#913983',
  tertiaryFaint: 'rgba(145,57,131,0.10)',
  text:          '#2B2A51',
  muted:         '#585781',
  border:        'rgba(171,169,215,0.35)',
  success:       '#16A34A',
  successFaint:  '#E7F6EC',
  warning:       '#D97706',
  warningFaint:  '#FEF3C7',
  danger:        '#B41340',
  dangerFaint:   'rgba(180,19,64,0.08)',
  white:         '#FFFFFF',
};

// Curva de salida suave (heavy fade-up) — sensación de masa real.
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Sombra ambiental difusa y tintada — nada de drop shadows duros.
export const softShadow = {
  shadowColor: '#2B2A51',
  shadowOpacity: 0.07,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 3,
};

// ---- Animación de entrada (fade + slide up escalonado) ----
export function FadeUp({ delay = 0, children, style }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: 720,
      delay,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [t, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---- Encabezado: botón volver + migaja "Perfil" + título hero con eyebrow ----
export function StatHeader({ navigation, route, eyebrow, title, accent = p.primary }) {
  return (
    <View style={hs.wrap}>
      <View style={hs.topRow}>
        <TouchableOpacity
          onPress={() => goBackOrReturnTo(navigation, route)}
          style={hs.backBtn}
          activeOpacity={0.75}
          hitSlop={10}
        >
          <MaterialIcons name="arrow-back" size={20} color={p.text} />
        </TouchableOpacity>
        <Text style={hs.crumb}>Perfil</Text>
      </View>

      <FadeUp delay={60}>
        <View style={[hs.eyebrow, { backgroundColor: accent === p.primary ? p.primaryFaint : 'rgba(145,57,131,0.10)' }]}>
          <View style={[hs.eyebrowDot, { backgroundColor: accent }]} />
          <Text style={[hs.eyebrowText, { color: accent }]}>{eyebrow}</Text>
        </View>
        <Text style={hs.title}>{title}</Text>
      </FadeUp>
    </View>
  );
}

// ---- Tarjeta "double-bezel": carcasa exterior + núcleo interior ----
export function Bezel({ children, style, tone = p.surfaceLow }) {
  return (
    <View style={[bs.shell, { backgroundColor: tone }, style]}>
      <View style={bs.core}>{children}</View>
    </View>
  );
}

// ---- CTA "Ver todas" con icono anidado (button-in-button) ----
export function VerTodasButton({ label = 'Ver todas', onPress, count }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: 'flex-end' }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => spring(0.97)}
        onPressOut={() => spring(1)}
        onPress={onPress}
        style={cs.btn}
      >
        <Text style={cs.btnText}>
          {label}{typeof count === 'number' ? ` · ${count}` : ''}
        </Text>
        <View style={cs.btnIcon}>
          <MaterialIcons name="arrow-forward" size={16} color={p.white} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---- Formato de moneda es-AR ----
export function money(n, cur) {
  const v = Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
  return cur ? `${cur} ${v}` : `$${v}`;
}

export function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  try {
    return new Date(fechaStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return fechaStr;
  }
}

const hs = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: p.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: p.border,
    ...softShadow, shadowOpacity: 0.05, shadowRadius: 12,
  },
  crumb: { fontSize: 13, fontWeight: '700', color: p.muted, letterSpacing: 0.3 },
  eyebrow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 999, marginBottom: 12,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrowText: { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 38, fontWeight: '900', color: p.text, lineHeight: 42, letterSpacing: -0.5 },
});

const bs = StyleSheet.create({
  shell: {
    borderRadius: 28,
    padding: 6,
    borderWidth: 1,
    borderColor: p.border,
    ...softShadow,
  },
  core: {
    backgroundColor: p.surface,
    borderRadius: 22,
    overflow: 'hidden',
  },
});

const cs = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: p.primary,
    paddingLeft: 20, paddingRight: 6, paddingVertical: 6,
    borderRadius: 999,
    ...softShadow,
    shadowColor: p.primary, shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
  },
  btnText: { color: p.white, fontWeight: '800', fontSize: 14, letterSpacing: 0.2 },
  btnIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
});
