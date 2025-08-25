import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, IconButton } from 'react-native-paper';
import { useApp } from '../context/AppContext';

interface QueryLimitBannerProps {
  onWatchAd?: () => void;
  onUpgrade?: () => void;
}

const QueryLimitBanner: React.FC<QueryLimitBannerProps> = ({ 
  onWatchAd, 
  onUpgrade 
}) => {
  const { colors } = useTheme();
  const { getRemainingQueries, canMakeQuery, showRewardedAd } = useApp();
  
  const remainingQueries = getRemainingQueries();
  const hasQueriesLeft = canMakeQuery();

  if (hasQueriesLeft && remainingQueries > 2) {
    // Don't show banner if plenty of queries left
    return null;
  }

  return (
    <Surface style={[
      styles.container, 
      { 
        backgroundColor: remainingQueries === 0 
          ? (colors as any).error 
          : (colors as any).warning,
        borderColor: colors.outline,
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Text variant="titleMedium" style={{ 
            color: remainingQueries === 0 ? (colors as any).onError : (colors as any).onWarning,
            fontWeight: '600' 
          }}>
            {remainingQueries === 0 ? 'Daily Limit Reached' : `${remainingQueries} Queries Left`}
          </Text>
          <Text variant="bodySmall" style={{ 
            color: remainingQueries === 0 ? (colors as any).onError : (colors as any).onWarning,
            opacity: 0.8 
          }}>
            {remainingQueries === 0 
              ? 'Watch an ad for 3 more queries or upgrade to Pro'
              : 'Watch an ad for 3 bonus queries'
            }
          </Text>
        </View>
        
        <View style={styles.actionSection}>
          {remainingQueries === 0 ? (
            <>
                             <TouchableOpacity
                 style={[styles.actionButton, { backgroundColor: (colors as any).onError }]}
                 onPress={async () => {
                   const success = await showRewardedAd();
                   if (!success && onWatchAd) {
                     onWatchAd();
                   }
                 }}
               >
                <Text variant="labelSmall" style={{ 
                  color: (colors as any).error, 
                  fontWeight: '600' 
                }}>
                  Watch Ad
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: (colors as any).onError }]}
                onPress={onUpgrade}
              >
                <Text variant="labelSmall" style={{ 
                  color: (colors as any).error, 
                  fontWeight: '600' 
                }}>
                  Upgrade
                </Text>
              </TouchableOpacity>
            </>
          ) : (
                             <TouchableOpacity
                   style={[styles.actionButton, { backgroundColor: (colors as any).onWarning }]}
                   onPress={async () => {
                     const success = await showRewardedAd();
                     if (!success && onWatchAd) {
                       onWatchAd();
                     }
                   }}
                 >
              <Text variant="labelSmall" style={{ 
                color: (colors as any).warning, 
                fontWeight: '600' 
              }}>
                +3 Queries
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});

export default QueryLimitBanner;
