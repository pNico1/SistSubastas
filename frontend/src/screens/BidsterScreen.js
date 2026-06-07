// src/screens/BidsterScreen.js
import React from 'react';
import { View, FlatList, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuctionSlide from '../components/AuctionSlide';
import TopAppBar from '../components/TopAppBar';
import BottomNavBar from '../components/BottomNavBar';
import auctionItems from '../constants/auctionItems';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BidsterScreen({ navigation }) {
  const getItemLayout = (_, index) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  });

  return (
    <View style={styles.root}>
      {/* Feed full-screen */}
      <FlatList
        data={auctionItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AuctionSlide item={item} navigation={navigation} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
        getItemLayout={getItemLayout}
        removeClippedSubviews
        bounces={false}
        overScrollMode="never"
      />

      {/* Header flotante */}
      <TopAppBar navigation={navigation} />

      {/* Nav inferior flotante */}
      <BottomNavBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a082f',
  },
});