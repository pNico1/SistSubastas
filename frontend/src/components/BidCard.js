import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function BidCard({ item, navigation }) {
  return (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <MaterialIcons name="image" size={44} color="rgba(8,70,237,0.25)" />
        </View>
      )}

      {(item.live || item.future) && (
        <View style={[styles.liveBadge, item.future && styles.futureBadge]}>
          <Text style={styles.liveText}>
            {item.live ? 'EN VIVO' : 'PROXIMA'}
          </Text>
        </View>
      )}

      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>
          {item.timeLeft}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.category}>
          {item.lots} Lotes • {item.category}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('SubastaDetail', { id: item.id })}
        >
          <Text style={styles.buttonText}>
            Ver subasta
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width * 0.82,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginRight: 20,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#E2DFFF',
  },

  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F790E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  futureBadge: {
    backgroundColor: '#0846ED',
  },

  liveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },

  timeBadge: {
    position: 'absolute',
    right: 12,
    top: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  timeText: {
    color: '#0846ED',
    fontWeight: '700',
    fontSize: 13,
  },

  body: {
    padding: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B2A51',
  },

  category: {
    color: '#585781',
    textTransform: 'capitalize',
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
  },

  button: {
    backgroundColor: '#0846ED',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
