import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { height: windowHeight } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Patek Philippe Nautilus',
    subtitle: 'Ref. 5711/1A - Blue Sunburst Dial',
    bid: '$142,500',
    meta: 'Lot #102 • Ending in 2h 15m',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCBS-1kqPp8BSdp16M6jJzCFf_d7orlcfhTuLzT6QwTgP-LJ0ikw6IaHc3dg06EYKybI5n5d8BUA0_xA56_ccP9qeFeM0eJi19ApM8rg70N-xui8cdoVGvx8Esir9HUYP6Al64VxkvgVLFUwm6KkzvyeJ8gPCs1XmRmFsRtFePN1aUpDArVrCkouenWn_t1YQ5pVABi_uWuBN1hC1CABdngUmvPlL_n8L1t5wsdAc-WQMFofaERGV9Whe1P2Ot6FcTcEf2kDGB6fnCO',
  },
  {
    id: '2',
    title: 'Kinetic Drift No. 4',
    subtitle: 'By Elena Rodriguez, 2023',
    bid: '$12,400',
    meta: 'Lot #248 • Ending in 4h 05m',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDzND7ts3mD1j8bS7O6aa_SdDYRAFmCHUdW7d0s849SRAV06fSe_cH6aLuicbKYCnKRb2wmFDWmCzoOwJPZXkbqmN7e1A5_m8ouWNUNp_efpuu7VLURUbUj2YDIceR6A9JshYWG32a3JzzhPtrsS6Uwv_8mMvtCfrXCVByoGpjNtPIDfunUaWswMU15fdfaRtPO3knV4EyknPmI2TAMZ_7fP2gPppEwXrA4ZrnE5JTwmDJexIP8SpzHfFuWti2r9RaJMt13_kJ63wQs',
  },
  {
    id: '3',
    title: '1967 Porsche 911 S',
    subtitle: 'Matching Numbers, Original Interior',
    bid: '$210,000',
    meta: 'Lot #015 • Ending in 1h 45m',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDKtLUb9TFtECzRdbG5hh7sbQA8NzBdBUjqf4a_bl8HLW8ySP9sSAMFjnLnsb0oHadqejaigygKfmnJ-oCCZ2L9tegwIdU7necgzpJ68g6DGMWJXsd8D04hVCOufq3_LierVs78jeaBCXgGodgb7OtK9Jg6DkqGETpvljHtL6866ZbCW5XGDoS_1PU7jJtZ_n8pZGOjQ_AcZn0SMMMVj6ZGXTH-bUZQk63NGoEUJPJdYdHfuHe2Dsf9rJzg45ETLWaRnCKM5kPTw_0d',
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>Bidster</Text>
        <View style={styles.accountBadge}>
          <MaterialIcons name="account-circle" size={24} color="#0846ed" />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        pagingEnabled
        snapToInterval={windowHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.slide, { height: windowHeight }]}>
            <ImageBackground source={{ uri: slide.image }} style={styles.imageBackground}>
              <View style={styles.overlay} />
              <View style={styles.slideContent}>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Live Auction</Text>
                </View>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaGroup}>
                    <Text style={styles.metaLabel}>Current Bid</Text>
                    <Text style={styles.metaValue}>{slide.bid}</Text>
                    <Text style={styles.metaSmall}>{slide.meta}</Text>
                  </View>
                  <TouchableOpacity style={styles.placeBidButton} activeOpacity={0.9}>
                    <Text style={styles.placeBidText}>Place Bid</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={0.8}>
          <MaterialIcons name="explore" size={22} color="#0846ed" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Subastas')}
        >
          <MaterialIcons name="gavel" size={22} color="#2b2a51" />
          <Text style={styles.navLabel}>PUJAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('OfrecerBien')}
        >
          <MaterialIcons name="add-circle" size={22} color="#2b2a51" />
          <Text style={styles.navLabel}>Subastar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Perfil')}
        >
          <MaterialIcons name="person" size={22} color="#2b2a51" />
          <Text style={styles.navLabel}>PERFIL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f5ff',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(43,42,81,0.08)',
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0846ed',
  },
  accountBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(233,229,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    marginTop: 64,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  slide: {
    width: '100%',
  },
  imageBackground: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 47, 0.72)',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 144, 224, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#913983',
    marginRight: 8,
  },
  badgeText: {
    color: '#5f0656',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  slideTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginBottom: 6,
  },
  slideSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaGroup: {
    flex: 1,
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  metaSmall: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 6,
  },
  placeBidButton: {
    backgroundColor: '#0846ed',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    shadowColor: '#0846ed',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  placeBidText: {
    color: '#f2f1ff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 86,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: 'rgba(43,42,81,0.08)',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: '#cfcdff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navLabel: {
    marginTop: 4,
    fontSize: 10,
    color: 'rgba(43,42,81,0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  navLabelActive: {
    color: '#0846ed',
  },
});
