import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ENVIRONMENT } from '../config/environment';

interface AdBannerProps {
  type?: 'banner' | 'interstitial' | 'rewarded';
  position?: 'top' | 'bottom' | 'inline';
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  type = 'banner', 
  position = 'bottom' 
}) => {
  const { colors } = useTheme();
  const [adUnitId, setAdUnitId] = useState<string>(TestIds.BANNER);

  useEffect(() => {
    // Use environment configuration for ad unit IDs
    if (__DEV__) {
      setAdUnitId(TestIds.BANNER);
    } else {
      setAdUnitId(ENVIRONMENT.ADMOB.bannerAdUnitId);
    }
  }, []);

  if (type !== 'banner') {
    // For interstitial and rewarded ads, we'd use different components
    return null;
  }

  return (
    <View style={[
      styles.container, 
      { 
        ...(position === 'top' && styles.topPosition),
        ...(position === 'bottom' && styles.bottomPosition),
        ...(position === 'inline' && styles.inlinePosition),
      }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  topPosition: {
    marginTop: 16,
    marginBottom: 8,
  },
  bottomPosition: {
    marginTop: 8,
    marginBottom: 16,
  },
  inlinePosition: {
    marginVertical: 8,
  },
  adContent: {
    flex: 1,
  },
  ctaButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});

export default AdBanner;
