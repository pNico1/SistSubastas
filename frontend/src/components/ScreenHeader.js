import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { clienteApi } from '../api/endpoints';
import { goBackOrReturnTo, navigateWithReturnTo } from '../navigationUtils';
import { NOTIFICATIONS_POLL_MS } from '../config';

const p = { bg: '#F9F5FF', primary: '#0846ED', field: '#DCD9FF', border: 'rgba(171,169,215,.3)', danger: '#B41340', text: '#2B2A51', white: '#FFF' };

export default function ScreenHeader({ navigation, route, title, showBack = true, showNotifications = true, onBackPress }) {
  const insets = useSafeAreaInsets();
  const [unread, setUnread] = useState(0);

  const loadUnread = useCallback(() => {
    if (!showNotifications) {
      setUnread(0);
      return;
    }
    clienteApi.notificaciones()
      .then((data) => setUnread((data || []).filter((n) => !n.leido).length))
      .catch(() => {});
  }, [showNotifications]);

  useFocusEffect(useCallback(() => {
    loadUnread();
    if (!showNotifications) return undefined;
    const t = setInterval(loadUnread, NOTIFICATIONS_POLL_MS);
    return () => clearInterval(t);
  }, [loadUnread, showNotifications]));
  const back = () => onBackPress ? onBackPress() : goBackOrReturnTo(navigation, route);
  return <View style={[styles.container, { paddingTop: insets.top }]}><View style={styles.inner}>
    {showBack ? <TouchableOpacity style={styles.icon} onPress={back} hitSlop={10}><MaterialIcons name="arrow-back" size={22} color={p.primary} /></TouchableOpacity> : <Text style={styles.brand}>BIDSTER</Text>}
    <Text style={styles.title} numberOfLines={1}>{title}</Text>
    {showNotifications ? <TouchableOpacity style={styles.icon} onPress={() => navigateWithReturnTo(navigation, 'Notificaciones')} hitSlop={10}>
      <MaterialIcons name="notifications-none" size={22} color={p.primary} />
      {unread > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View> : null}
    </TouchableOpacity> : <View style={styles.spacer} />}
  </View></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: p.bg, borderBottomWidth: 1, borderBottomColor: p.border, ...Platform.select({ ios: { shadowColor: p.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: .06, shadowRadius: 16 }, android: { elevation: 4 } }) },
  inner: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  brand: { width: 44, color: p.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { flex: 1, color: p.text, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: p.field },
  spacer: { width: 38, height: 38 }, badge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: p.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: p.white }, badgeText: { color: p.white, fontSize: 9, fontWeight: '800' },
});
