import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  LinearGradient,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Chip,
  Divider,
  Card,
  List,
  Switch,
  Slider,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme, spacing, shadows, borderRadius } from '../theme/theme';
import { useApp } from '../context/AppContext';

const { width, height } = Dimensions.get('window');

const DesignShowcaseScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { state } = useApp();
  
  const [selectedScreen, setSelectedScreen] = useState<'home' | 'camera' | 'confirmation' | 'results' | 'history' | 'settings'>('home');
  const [selectedDesign, setSelectedDesign] = useState<'premium' | 'professional' | 'minimal'>('premium');
  const [realData, setRealData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch real data from backend or use app state
    const fetchRealData = async () => {
      try {
        // Use real data from app context or fetch from backend
        if (state.searchHistory && state.searchHistory.length > 0) {
          setRealData({
            recentItems: state.searchHistory.slice(0, 3),
            stats: {
              itemsToday: state.searchHistory.filter(item => {
                const today = new Date();
                const itemDate = new Date(item.createdAt);
                return itemDate.toDateString() === today.toDateString();
              }).length,
              totalValue: state.searchHistory.reduce((sum, item) => sum + (item.marketValue || 0), 0),
              totalOffers: state.searchHistory.reduce((sum, item) => sum + (item.pawnValue || 0), 0),
            }
          });
        } else {
          // No real data available, show empty state
          setRealData({
            recentItems: [],
            stats: { itemsToday: 0, totalValue: 0, totalOffers: 0 }
          });
        }
      } catch (error) {
        console.error('Failed to fetch real data:', error);
        setRealData({
          recentItems: [],
          stats: { itemsToday: 0, totalValue: 0, totalOffers: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, [state.searchHistory]);

  const renderPremiumHomeDesign = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text variant="headlineMedium" style={{ color: colors.onBackground, padding: spacing.lg, textAlign: 'center' }}>
        Premium Dark Theme
      </Text>

      {/* Hero Section with Gradient */}
      <View style={styles.designSection}>
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
              <Text variant="headlineLarge" style={{ color: colors.gold, fontWeight: '700' }}>
                {isLoading ? '...' : realData?.stats?.itemsToday || 0}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>Items Today</Text>
            </View>
            <View style={styles.premiumStatItem}>
              <Text variant="headlineLarge" style={{ color: colors.marketValue, fontWeight: '700' }}>
                {isLoading ? '...' : `$${(realData?.stats?.totalValue / 1000).toFixed(1)}K`}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>Total Value</Text>
            </View>
            <View style={styles.premiumStatItem}>
              <Text variant="headlineLarge" style={{ color: colors.pawnValue, fontWeight: '700' }}>
                {isLoading ? '...' : `$${(realData?.stats?.totalOffers / 1000).toFixed(1)}K`}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>Total Offers</Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* Premium Action Cards */}
      <View style={styles.designSection}>
        <View style={styles.premiumActionGrid}>
          <TouchableOpacity style={[styles.premiumActionCard, { backgroundColor: colors.primary }]}>
            <View style={styles.premiumActionIcon}>
              <Text style={{ fontSize: 32, color: colors.onPrimary }}>📷</Text>
            </View>
            <Text variant="titleMedium" style={{ color: colors.onPrimary, fontWeight: '600', marginTop: spacing.sm }}>
              Capture Item
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onPrimary, opacity: 0.8, textAlign: 'center' }}>
              AI-powered identification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.premiumActionCard, { backgroundColor: colors.secondary }]}>
            <View style={styles.premiumActionIcon}>
              <Text style={{ fontSize: 32, color: colors.onSecondary }}>🔍</Text>
            </View>
            <Text variant="titleMedium" style={{ color: colors.onSecondary, fontWeight: '600', marginTop: spacing.sm }}>
              Search Database
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSecondary, opacity: 0.8, textAlign: 'center' }}>
              Market analysis
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Recent Items */}
      <View style={styles.designSection}>
        <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: spacing.md, fontWeight: '600' }}>
          Recent Valuations
        </Text>
        {realData?.recentItems && realData.recentItems.length > 0 ? (
          realData.recentItems.map((item: any, index: number) => (
            <Surface key={index} style={[styles.premiumItemCard, { backgroundColor: colors.surfaceVariant }]}>
              <View style={styles.premiumItemContent}>
                <View style={styles.premiumItemInfo}>
                  <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                    {item.category} • {item.condition}
                  </Text>
                </View>
                <View style={styles.premiumItemValues}>
                  <Text variant="titleMedium" style={{ color: colors.marketValue, fontWeight: '700' }}>
                    ${item.marketValue?.toLocaleString() || '0'}
                  </Text>
                  <Text variant="bodySmall" style={{ color: colors.pawnValue, fontWeight: '600' }}>
                    Offer: ${item.pawnValue?.toLocaleString() || '0'}
                  </Text>
                </View>
              </View>
            </Surface>
          ))
        ) : (
          <Surface style={[styles.premiumItemCard, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.premiumItemContent}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: spacing.lg }}>
                No recent valuations. Start by capturing or searching for an item!
              </Text>
            </View>
          </Surface>
        )}
      </View>
    </ScrollView>
  );

  const renderProfessionalResultsDesign = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text variant="headlineMedium" style={{ color: colors.onBackground, padding: spacing.lg, textAlign: 'center' }}>
        Professional Results Display
      </Text>

      {/* Premium Value Display */}
      <View style={styles.designSection}>
        <Surface style={[styles.premiumValueCard, { backgroundColor: colors.primary }]}>
          <View style={styles.premiumValueHeader}>
            <Text variant="titleMedium" style={{ color: colors.onPrimary, textAlign: 'center', opacity: 0.9 }}>
              ESTIMATED MARKET VALUE
            </Text>
            <Text variant="displayLarge" style={{ color: colors.onPrimary, textAlign: 'center', fontWeight: '700' }}>
              ${state.currentItem?.marketValue?.toLocaleString() || '0'}
            </Text>
            <View style={styles.premiumConfidenceBadge}>
              <Text variant="labelMedium" style={{ color: colors.onPrimary, fontWeight: '600' }}>
                {Math.round((state.currentItem?.confidence || 0) * 100)}% Confidence
              </Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* Premium Offer Display */}
      <View style={styles.designSection}>
        <Surface style={[styles.premiumOfferCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.premiumOfferHeader}>
            <Text variant="headlineSmall" style={{ color: colors.onSecondary, textAlign: 'center', fontWeight: '700' }}>
              YOUR OFFER
            </Text>
            <Text variant="displayMedium" style={{ color: colors.onSecondary, textAlign: 'center', fontWeight: '700' }}>
              ${state.currentItem?.pawnValue?.toLocaleString() || '0'}
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSecondary, textAlign: 'center', opacity: 0.9 }}>
              30% of market value
            </Text>
          </View>
        </Surface>
      </View>

      {/* Premium Item Details */}
      <View style={styles.designSection}>
        <Surface style={[styles.premiumDetailsCard, { backgroundColor: colors.surface }]}>
          <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: spacing.lg, fontWeight: '600' }}>
            Item Details
          </Text>
          
          <View style={styles.premiumDetailRow}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Item Name</Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>{state.currentItem?.name || 'N/A'}</Text>
          </View>
          <Divider style={{ marginVertical: spacing.sm }} />
          
          <View style={styles.premiumDetailRow}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Category</Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>{state.currentItem?.category || 'N/A'}</Text>
          </View>
          <Divider style={{ marginVertical: spacing.sm }} />
          
          <View style={styles.premiumDetailRow}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Condition</Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>{state.currentItem?.condition || 'N/A'}</Text>
          </View>
          <Divider style={{ marginVertical: spacing.sm }} />
          
          <View style={styles.premiumDetailRow}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Potential Profit</Text>
            <Text variant="titleMedium" style={{ color: colors.profit, fontWeight: '700' }}>
              ${((state.currentItem?.marketValue || 0) - (state.currentItem?.pawnValue || 0)).toLocaleString()}
            </Text>
          </View>
        </Surface>
      </View>

      {/* Premium Action Buttons */}
      <View style={styles.designSection}>
        <View style={styles.premiumActionButtons}>
          <TouchableOpacity style={[styles.premiumActionButton, { backgroundColor: colors.success }]}>
            <Text style={{ color: colors.onSuccess, textAlign: 'center', fontWeight: '700', fontSize: 16 }}>
              Accept Offer
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.premiumActionButton, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={{ color: colors.onSurface, textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
              Adjust Offer
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.premiumActionButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.outline }]}>
            <Text style={{ color: colors.onSurface, textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
              New Estimate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderMinimalHistoryDesign = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text variant="headlineMedium" style={{ color: colors.onBackground, padding: spacing.lg, textAlign: 'center' }}>
        Minimal Dark History
      </Text>

      {/* Minimal Header */}
      <View style={styles.designSection}>
        <View style={styles.minimalHeader}>
          <Text variant="headlineLarge" style={{ color: colors.onSurface, fontWeight: '300' }}>
            History
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            Your valuation history
          </Text>
        </View>
      </View>

      {/* Minimal Filter Bar */}
      <View style={styles.designSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip selected style={[styles.minimalChip, { backgroundColor: colors.primary }]}>All</Chip>
          <Chip style={[styles.minimalChip, { backgroundColor: colors.surfaceVariant }]}>Electronics</Chip>
          <Chip style={[styles.minimalChip, { backgroundColor: colors.surfaceVariant }]}>Jewelry</Chip>
          <Chip style={[styles.minimalChip, { backgroundColor: colors.surfaceVariant }]}>Watches</Chip>
        </ScrollView>
      </View>

      {/* Minimal History List */}
      <View style={styles.designSection}>
        {realData?.recentItems && realData.recentItems.length > 0 ? (
          realData.recentItems.map((item: any, index: number) => (
            <View key={index} style={styles.minimalHistoryItem}>
              <View style={styles.minimalHistoryContent}>
                <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing.xs }}>
                  {item.category} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.minimalHistoryValues}>
                <Text variant="titleMedium" style={{ color: colors.marketValue, fontWeight: '600' }}>
                  ${item.marketValue?.toLocaleString() || '0'}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.pawnValue, fontWeight: '500' }}>
                  ${item.pawnValue?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.minimalHistoryItem}>
            <View style={styles.minimalHistoryContent}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', padding: spacing.lg }}>
                No history available. Start by capturing or searching for items!
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderScreenSelector = () => (
    <View style={styles.screenSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'home', label: 'Home' },
          { key: 'camera', label: 'Camera' },
          { key: 'confirmation', label: 'Confirmation' },
          { key: 'results', label: 'Results' },
          { key: 'history', label: 'History' },
          { key: 'settings', label: 'Settings' },
        ].map((screen) => (
          <Chip
            key={screen.key}
            selected={selectedScreen === screen.key}
            onPress={() => setSelectedScreen(screen.key as any)}
            style={[styles.screenChip, selectedScreen === screen.key && { backgroundColor: colors.primary }]}
            textStyle={{ color: selectedScreen === screen.key ? colors.onPrimary : colors.onSurface }}
          >
            {screen.label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  const renderDesignSelector = () => (
    <View style={styles.designSelector}>
      <Chip
        selected={selectedDesign === 'premium'}
        onPress={() => setSelectedDesign('premium')}
        style={[styles.designChip, selectedDesign === 'premium' && { backgroundColor: colors.gold }]}
        textStyle={{ color: selectedDesign === 'premium' ? colors.onSecondary : colors.onSurface }}
      >
        Premium
      </Chip>
      <Chip
        selected={selectedDesign === 'professional'}
        onPress={() => setSelectedDesign('professional')}
        style={[styles.designChip, selectedDesign === 'professional' && { backgroundColor: colors.primary }]}
        textStyle={{ color: selectedDesign === 'professional' ? colors.onPrimary : colors.onSurface }}
      >
        Professional
      </Chip>
      <Chip
        selected={selectedDesign === 'minimal'}
        onPress={() => setSelectedDesign('minimal')}
        style={[styles.designChip, selectedDesign === 'minimal' && { backgroundColor: colors.surfaceVariant }]}
        textStyle={{ color: selectedDesign === 'minimal' ? colors.onSurface : colors.onSurfaceVariant }}
      >
        Minimal
      </Chip>
    </View>
  );

  const renderContent = () => {
    switch (selectedScreen) {
      case 'home':
        return renderPremiumHomeDesign();
      case 'results':
        return renderProfessionalResultsDesign();
      case 'history':
        return renderMinimalHistoryDesign();
      default:
        return renderPremiumHomeDesign();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          onPress={() => navigation.goBack()}
          iconColor={colors.onSurface}
        />
        <Text variant="headlineMedium" style={{ color: colors.onBackground, flex: 1, fontWeight: '600' }}>
          Design Showcase
        </Text>
      </View>

      {/* Screen Selector */}
      {renderScreenSelector()}

      {/* Design Selector */}
      {renderDesignSelector()}

      {/* Content */}
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenSelector: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  screenChip: {
    marginRight: spacing.sm,
  },
  designSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  designChip: {
    marginHorizontal: spacing.xs,
  },
  designSection: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  
  // Premium Home Design
  premiumHeroCard: {
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
  
  // Premium Results Design
  premiumValueCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.large,
  },
  premiumValueHeader: {
    alignItems: 'center',
  },
  premiumConfidenceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  premiumOfferCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.large,
  },
  premiumOfferHeader: {
    alignItems: 'center',
  },
  premiumDetailsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  premiumDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  premiumActionButtons: {
    gap: spacing.md,
  },
  premiumActionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
  },
  
  // Minimal History Design
  minimalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  minimalChip: {
    marginRight: spacing.sm,
  },
  minimalHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  minimalHistoryContent: {
    flex: 1,
  },
  minimalHistoryValues: {
    alignItems: 'flex-end',
  },
});

export default DesignShowcaseScreen;
