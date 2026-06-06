import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

const surfaceContainerLow = '#f2efff';
const { width } = Dimensions.get('window');

const cards = [
  {
    id: '1',
    title: '1967 Shelby Mustang GT500',
    description: 'Original 428 cubic-inch Police Interceptor engine. Fully restored to concours standards.',
    lot: 'LOT #402',
    lockLabel: 'Current Bid',
    value: 'Regístrate para ver',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBoRYsGhMv2wnj41IVt7cLuDXmPgDWl0KsF0N1wwdCX8zD_mjlP2IQDLtCQuKzS6Lw6XMN7nrwV8yPt1uoHbalLq-mTEDhiW97mUfVr1dTLsqaUf431AJNF1ATVxpwRNVZ-6eobGXLXKGI8r0Eo_LZnUPvNpP9s12F79sBpKkCD89BfZ2lxpmF13t9rfAz6_YSHoYL0fTkAZXZb7NVkuReuGr3P6GvdBia3tJhwTpKL0AF5xfclYEYl2k2E1GbyKwd5ddX0gyXX3Zs',
  },
  {
    id: '2',
    title: 'Ferrari F40 Berlinetta',
    description: 'Legendary twin-turbo V8. One of the last units overseen by Enzo Ferrari himself.',
    lot: 'LOT #405',
    lockLabel: 'Base Price',
    value: 'Regístrate para ver',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDeUqehdhz2WXzi_iZ9YlIO-D3vWeFsxJ_9-9WQJpw9BqdRkK5FT985A8w8ThapNz0YGH3b0yBFRCKeLRFe4hD0xfeXwgY1pTvowMEurE0WoZDyJYyKQQzOl4t4LC9utaAYYrAOBuVs2xSWvWl2BI_tfx0e9xulMEfM5NLErC6WlUw2YOzYhsE4AsLO1QWZ9WipW_sYENiFEp3ZfuaBOHQQdYWa8LxHjTfxVJYIsXgCITt3d8IBLgNX0H_mzJ4_Ug8REnRmVAfpa7Q',
  },
  {
    id: '3',
    title: '1973 Porsche 911 Carrera RS',
    description: 'Silver coupe with historic provenance and iconic ducktail spoiler.',
    lot: 'LOT #408',
    lockLabel: 'Preview',
    value: 'Próxima subasta',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4Q11Ck7yaQYa2kCEADdLL2xlsGvzD_7BQ5HoJVffl2-BVq_YqWWmNyjsayRimdMBSFpRe0rVe8vENICKUoPyE_E1SaHRh7tXUNAaBUP6zULA9RSAYJ2qO1e_keO2Zj54UBN8VFNJv_XewbE5HEeBXACPGQrf5a2Qt14-ioDrxtShOgok2nB0pebxxl39cH3kdPoqq_m3UKivdvZWLQEjo43xhyxtyy3doZUGlI_pMMI2Wh_V6m3WJmOQNryDQa1GufipxLU_jW3I',
  },
];

export default function SubastasFooter() {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.sectionTag}>Special Exhibition: Classic Motors</Text>
          <Text style={styles.sectionTitle}>Colección: Automóviles Clásicos</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}> 
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}> 
            <MaterialIcons name="arrow-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        style={styles.carouselWrapper}
        snapToInterval={width * 0.85}
        decelerationRate="fast"
      >
        {cards.map((card) => (
          <View key={card.id} style={styles.cardWrapper}>
            <View style={styles.card}>
              <ImageBackground source={{ uri: card.image }} style={styles.cardImage} imageStyle={styles.cardImageStyle}>
                <View style={styles.cardOverlay} />
                <View style={styles.imageBadges}>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>Live Auction</Text>
                  </View>
                  <View style={styles.lotBadge}>
                    <Text style={styles.lotBadgeText}>{card.lot}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
                  <MaterialIcons name="favorite" size={20} color={colors.text} />
                </TouchableOpacity>
              </ImageBackground>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription} numberOfLines={1}>{card.description}</Text>
                <View style={styles.cardDetailBox}>
                  <View style={styles.lockCircle}>
                    <MaterialIcons name="lock" size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>{card.lockLabel}</Text>
                    <Text style={styles.cardValue}>{card.value}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>12</Text>
          <Text style={styles.statsLabel}>Vehículos únicos en catálogo</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>€4.2M</Text>
          <Text style={styles.statsLabel}>Estimación total de la subasta</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>842</Text>
          <Text style={styles.statsLabel}>Postores registrados actualmente</Text>
        </View>
      </View>

      <View style={styles.bottomFooter}> 
        <MaterialIcons name="list-alt" size={18} color={colors.primary} />
        <Text style={styles.bottomFooterText}>12 vehículos únicos en catálogo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sectionTag: {
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  headerActions: {
    flexDirection: 'row',
  },
  navIconSpacing: {
    marginLeft: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.xs,
  },
  carouselWrapper: {
    marginBottom: spacing.lg,
  },
  carousel: {
    paddingBottom: spacing.md,
  },
  cardWrapper: {
    width: width * 0.85,
    marginRight: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  cardImage: {
    width: '100%',
    height: 220,
    justifyContent: 'space-between',
  },
  cardImageStyle: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 8, 47, 0.18)',
  },
  imageBadges: {
    padding: spacing.md,
  },
  liveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(247, 144, 224, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveBadgeText: {
    color: '#5f0656',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  lotBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lotBadgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.76)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  cardDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDetailIcon: {
    marginRight: spacing.sm,
  },
  lockCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(133, 154, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  cardValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(133, 154, 255, 0.18)',
  },
  statsValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  statsLabel: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  bottomFooter: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(43,42,81,0.08)',
  },
  bottomIconSpacing: {
    marginRight: spacing.sm,
  },
  bottomFooterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
