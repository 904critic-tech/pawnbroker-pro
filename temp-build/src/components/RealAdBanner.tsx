import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface RealAdBannerProps {
  position?: 'top' | 'bottom';
}

const RealAdBanner: React.FC<RealAdBannerProps> = ({ position = 'bottom' }) => {
  // Use test ad unit ID for development, real ad unit ID for production
  const adUnitId = __DEV__ 
    ? TestIds.BANNER 
    : 'ca-app-pub-7869206132163225/2632598195';

  return (
    <View style={[
      styles.container, 
      position === 'top' ? styles.topPosition : styles.bottomPosition
    ]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  topPosition: {
    marginTop: 10,
  },
  bottomPosition: {
    marginBottom: 10,
  },
});

export default RealAdBanner;
