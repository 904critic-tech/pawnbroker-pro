import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  IconButton,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme, spacing, shadows, borderRadius } from '../theme/theme';
import { useApp } from '../context/AppContext';
import LearningService from '../services/LearningService';
import { isFeatureEnabled } from '../config/environment';
import logger from '../utils/logger';
// Temporarily disable ads for Expo Go compatibility
// import RealAdBanner from '../components/RealAdBanner';
// Temporarily disable QueryLimitBanner for debugging
// import QueryLimitBanner from '../components/QueryLimitBanner';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { state } = useApp();
  
  const [dailyStats, setDailyStats] = useState({
    itemsPriced: 0,
    totalMarketValue: 0,
    totalOffers: 0,
    averageConfidence: 0,
  });
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simplified - no API calls for now
    setIsLoading(false);
  }, []);

  const quickActions = [
    {
      title: 'Scan Product',
      subtitle: 'Use camera to identify',
      icon: '📸',
      color: colors.primary,
      onPress: () => navigation.navigate('Camera' as never),
    },
    {
      title: 'Search Items',
      subtitle: 'Manual search',
      icon: '🔍',
      color: colors.secondary,
      onPress: () => navigation.navigate('Search' as never),
    },
    {
      title: 'View History',
      subtitle: 'Past valuations',
      icon: '📋',
      color: colors.tertiary,
      onPress: () => navigation.navigate('History' as never),
    },


  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Hero Section */}
        <Surface style={[styles.premiumHeroCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.gradientOverlay, { backgroundColor: colors.primary }]}>
            <Text variant="displaySmall" style={{ color: colors.onPrimary, textAlign: 'center', fontWeight: '700' }}>
              PawnBroker Pro
            </Text>
            <Text variant="titleMedium" style={{ color: colors.onPrimary, textAlign: 'center', opacity: 0.9, marginTop: spacing.sm }}>
              Professional Pricing Intelligence
            </Text>
          </View>
          
          <View style={styles.premiumStats}>
            <View style={styles.premiumStatItem}>
              <Text variant="headlineLarge" style={{ color: (colors as any).gold, fontWeight: '700' }}>
                {isLoading ? '...' : dailyStats.itemsPriced}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Items Today
              </Text>
            </View>
            <View style={styles.premiumStatItem}>
              <Text variant="headlineLarge" style={{ color: (colors as any).marketValue, fontWeight: '700' }}>
                {isLoading ? '...' : `$${(dailyStats.totalMarketValue / 1000).toFixed(1)}K`}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Total Value
              </Text>
            </View>
            <View style={styles.premiumStatItem}>
              <Text variant="headlineLarge" style={{ color: (colors as any).pawnValue, fontWeight: '700' }}>
                {isLoading ? '...' : `$${(dailyStats.totalOffers / 1000).toFixed(1)}K`}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                Total Offers
              </Text>
            </View>
          </View>
        </Surface>

        {/* Premium Action Cards */}
        <View style={styles.actionSection}>
          <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: spacing.lg, fontWeight: '600' }}>
            Quick Actions
          </Text>
          <View style={styles.premiumActionGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.premiumActionCard, { backgroundColor: action.color }]}
                onPress={action.onPress}
                accessibilityLabel={`${action.title} - ${action.subtitle}`}
                accessibilityHint={`Double tap to ${action.title.toLowerCase()}`}
                accessibilityRole="button"
              >
                <View style={styles.premiumActionIcon}>
                  <Text style={{ fontSize: 32, color: colors.onPrimary }}>
                    {action.icon}
                  </Text>
                </View>
                <Text variant="titleMedium" style={{ color: colors.onPrimary, fontWeight: '600', marginTop: spacing.sm }}>
                  {action.title}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onPrimary, opacity: 0.8, textAlign: 'center' }}>
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Premium Recent Items */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: '600' }}>
              Recent Valuations
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('History' as never)}
              accessibilityLabel="View all recent valuations"
              accessibilityHint="Double tap to view complete history"
              accessibilityRole="button"
            >
              <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: '600' }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          
          {recentItems.length > 0 ? (
            recentItems.map((item, index) => (
              <Surface key={item._id} style={[styles.premiumItemCard, { backgroundColor: colors.surfaceVariant }]}>
                <View style={styles.premiumItemContent}>
                  <View style={styles.premiumItemInfo}>
                    <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                      {item.category} • {item.status}
                    </Text>
                  </View>
                                     <View style={styles.premiumItemValues}>
                     <Text variant="titleMedium" style={{ color: (colors as any).marketValue, fontWeight: '700' }}>
                       ${item.marketValue.toLocaleString()}
                     </Text>
                     <Text variant="bodySmall" style={{ color: (colors as any).pawnValue, fontWeight: '600' }}>
                       Offer: ${item.pawnValue.toLocaleString()}
                     </Text>
                   </View>
                </View>
              </Surface>
            ))
          ) : (
            <Surface style={[styles.premiumItemCard, { backgroundColor: colors.surfaceVariant }]}>
              <View style={styles.premiumItemContent}>
                <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: spacing.lg }}>
                  No recent items. Start by capturing or searching for an item!
                </Text>
              </View>
            </Surface>
          )}
        </View>

                 {/* Premium Performance Metrics */}
         <View style={styles.metricsSection}>
           <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: spacing.lg, fontWeight: '600' }}>
             Performance Metrics
           </Text>
           <Surface style={[styles.metricsCard, { backgroundColor: colors.surface }]}>
             <View style={styles.metricRow}>
               <View style={styles.metricItem}>
                 <Text variant="headlineSmall" style={{ color: (colors as any).success, fontWeight: '700' }}>
                   {Math.round(dailyStats.averageConfidence * 100)}%
                 </Text>
                 <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                   Average Confidence
                 </Text>
               </View>
               <View style={styles.metricItem}>
                 <Text variant="headlineSmall" style={{ color: (colors as any).info, fontWeight: '700' }}>
                   ${Math.round(dailyStats.totalMarketValue / dailyStats.itemsPriced).toLocaleString()}
                 </Text>
                 <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                   Avg Item Value
                 </Text>
               </View>
             </View>
           </Surface>
         </View>

         {/* Query Limit Banner - Temporarily disabled */}
         {/* <QueryLimitBanner 
           onWatchAd={() => {
             // Implement rewarded ad functionality
             logger.log('Watch rewarded ad for +3 queries');
           }}
           onUpgrade={() => {
             // Navigate to upgrade screen
             logger.log('Navigate to upgrade screen');
           }}
         /> */}

                   {/* Ad Banner */}
          {/* Temporarily disabled for Expo Go compatibility */}
        {/* <RealAdBanner position="bottom" /> */}
       </ScrollView>
     </SafeAreaView>
   );
 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Premium Hero Section
  premiumHeroCard: {
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  gradientOverlay: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  premiumStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
  },
  premiumStatItem: {
    alignItems: 'center',
  },
  
  // Premium Action Cards
  actionSection: {
    padding: spacing.lg,
  },
  premiumActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  premiumActionCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2, // Two columns with gap
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.medium,
  },
  premiumActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Premium Recent Items
  recentSection: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  premiumItemCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  premiumItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumItemInfo: {
    flex: 1,
  },
  premiumItemValues: {
    alignItems: 'flex-end',
  },
  
  // Premium Metrics
  metricsSection: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  metricsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
});

export default HomeScreen;
