import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Surface,
  useTheme,
  Chip,
  Divider,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';
import { marketplaceService } from '../services/MarketplaceService';

interface SoldItem {
  id: string;
  title: string;
  price: number;
  soldDate: string;
  condition: string;
  location?: string;
  shipping?: number;
  totalPrice: number;
}

interface PricingBreakdown {
  marketValue: number;
  pawnValue: number;
  confidence: number;
  dataPoints: number;
  priceRange: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
  soldItems: SoldItem[];
  calculationMethod: string;
  lastUpdated: string;
}

const ExactPricingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  
  const searchQuery = route.params?.searchQuery || '';
  const selectedBrand = route.params?.selectedBrand || '';
  const selectedModel = route.params?.selectedModel || '';
  const modelFullName = route.params?.modelFullName || '';
  
  const [pricingData, setPricingData] = useState<PricingBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    if (searchQuery && selectedBrand && selectedModel) {
      loadExactPricing();
    }
  }, [searchQuery, selectedBrand, selectedModel]);

  const loadExactPricing = async () => {
    try {
      setIsLoading(true);
      
      // Search for the exact model
      const searchTerm = `${selectedBrand} ${selectedModel} ${searchQuery}`;
      const comprehensiveData = await marketplaceService.getComprehensiveMarketData(searchTerm);
      
      // Extract exact pricing data
      const exactPricing = extractExactPricing(comprehensiveData, searchTerm);
      
      setPricingData(exactPricing);
      
    } catch (error) {
      console.error('Failed to load exact pricing:', error);
      Alert.alert('Error', 'Failed to load exact pricing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractExactPricing = (data: any, searchTerm: string): PricingBreakdown => {
    const soldItems: SoldItem[] = [];
    
    // Extract from eBay data if available
    if (data.sources?.ebay?.data?.items) {
      const items = data.sources.ebay.data.items;
      
      items.forEach((item: any, index: number) => {
        soldItems.push({
          id: `item-${index}`,
          title: item.title,
          price: item.price,
          soldDate: item.soldDate || 'Unknown',
          condition: item.condition || 'Used',
          location: item.location,
          shipping: item.shipping || 0,
          totalPrice: item.price + (item.shipping || 0),
        });
      });
    }
    
    // Calculate pricing statistics
    const prices = soldItems.map(item => item.totalPrice).sort((a, b) => a - b);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const medianPrice = prices.length % 2 === 0 
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];
    
    const marketValue = Math.round(avgPrice);
    const pawnValue = Math.round(marketValue * 0.3);
    const confidence = Math.min(soldItems.length / 10, 0.95);
    
    return {
      marketValue,
      pawnValue,
      confidence,
      dataPoints: soldItems.length,
      priceRange: {
        min: Math.round(prices[0] || 0),
        max: Math.round(prices[prices.length - 1] || 0),
        avg: Math.round(avgPrice),
        median: Math.round(medianPrice),
      },
      soldItems,
      calculationMethod: `Based on ${soldItems.length} completed eBay sales of ${selectedBrand} ${selectedModel} ${searchQuery}`,
      lastUpdated: new Date().toISOString(),
    };
  };

  const handleConfirmPricing = () => {
    if (!pricingData) {
      Alert.alert('No pricing data available');
      return;
    }

    // Create the final item object with exact pricing
    const item = {
      id: Date.now().toString(),
      name: modelFullName,
      category: searchQuery,
      brand: selectedBrand,
      model: selectedModel,
      condition: 'Used',
      marketValue: pricingData.marketValue,
      pawnValue: pricingData.pawnValue,
      confidence: pricingData.confidence,
      searchResults: pricingData.soldItems,
      priceRange: pricingData.priceRange,
      dataPoints: pricingData.dataPoints,
      calculationMethod: pricingData.calculationMethod,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SET_CURRENT_ITEM', payload: item });
    navigation.navigate('ItemConfirmation' as never);
  };

  const renderSoldItem = ({ item }: { item: SoldItem }) => (
    <Card style={[styles.soldItemCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <View style={styles.soldItemHeader}>
          <View style={styles.soldItemInfo}>
            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
              {item.title.length > 60 ? item.title.substring(0, 60) + '...' : item.title}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              Sold: {item.soldDate} • {item.condition}
            </Text>
          </View>
          <View style={styles.soldItemPrice}>
            <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
              ${item.totalPrice}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              ${item.price} + ${item.shipping} shipping
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const displayedItems = showAllItems ? pricingData?.soldItems : pricingData?.soldItems.slice(0, 5);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Loading exact pricing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pricingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text>No pricing data available</Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          iconColor={colors.onBackground}
        />
        <Text variant="headlineSmall" style={{ color: colors.onBackground, flex: 1 }}>
          Exact Pricing
        </Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text variant="headlineMedium" style={{ color: colors.onBackground, fontWeight: '600' }}>
            {selectedBrand} {selectedModel}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            {searchQuery}
          </Text>
        </View>

        {/* Main Pricing Card */}
        <Card style={[styles.mainPricingCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.pricingHeader}>
              <Text variant="headlineLarge" style={{ color: colors.primary, fontWeight: 'bold' }}>
                ${pricingData.marketValue}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                Market Value
              </Text>
            </View>
            
            <View style={styles.pricingDetails}>
              <View style={styles.pricingRow}>
                <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                  Pawn Value:
                </Text>
                <Text variant="titleMedium" style={{ color: colors.secondary, fontWeight: 'bold' }}>
                  ${pricingData.pawnValue}
                </Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                  Confidence:
                </Text>
                <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {Math.round(pricingData.confidence * 100)}%
                </Text>
              </View>
              
              <View style={styles.pricingRow}>
                <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                  Data Points:
                </Text>
                <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {pricingData.dataPoints} sales
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Price Range */}
        <Card style={[styles.rangeCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600', marginBottom: spacing.sm }}>
              Price Range
            </Text>
            <View style={styles.rangeGrid}>
              <View style={styles.rangeItem}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Minimum
                </Text>
                <Text variant="titleMedium" style={{ color: colors.error, fontWeight: 'bold' }}>
                  ${pricingData.priceRange.min}
                </Text>
              </View>
              <View style={styles.rangeItem}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Average
                </Text>
                <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
                  ${pricingData.priceRange.avg}
                </Text>
              </View>
              <View style={styles.rangeItem}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Median
                </Text>
                <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
                  ${pricingData.priceRange.median}
                </Text>
              </View>
              <View style={styles.rangeItem}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Maximum
                </Text>
                <Text variant="titleMedium" style={{ color: colors.error, fontWeight: 'bold' }}>
                  ${pricingData.priceRange.max}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Calculation Method */}
        <Card style={[styles.methodCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600', marginBottom: spacing.sm }}>
              Calculation Method
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {pricingData.calculationMethod}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing.sm }}>
              Last updated: {new Date(pricingData.lastUpdated).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Sold Items */}
        <Card style={[styles.soldItemsCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.soldItemsHeader}>
              <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                Recent Sales ({pricingData.soldItems.length})
              </Text>
              <TouchableOpacity onPress={() => setShowAllItems(!showAllItems)}>
                <Text variant="bodySmall" style={{ color: colors.primary }}>
                  {showAllItems ? 'Show Less' : 'Show All'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={displayedItems || []}
              renderItem={renderSoldItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </Card.Content>
        </Card>
      </ScrollView>
      
      <View style={styles.bottomSection}>
        <Button
          mode="contained"
          onPress={handleConfirmPricing}
          style={styles.confirmButton}
        >
          Confirm Pricing
        </Button>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  productInfo: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  mainPricingCard: {
    margin: spacing.lg,
    marginTop: 0,
    ...shadows.medium,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pricingDetails: {
    gap: spacing.sm,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeCard: {
    margin: spacing.lg,
    marginTop: 0,
    ...shadows.medium,
  },
  rangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  rangeItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  methodCard: {
    margin: spacing.lg,
    marginTop: 0,
    ...shadows.medium,
  },
  soldItemsCard: {
    margin: spacing.lg,
    marginTop: 0,
    ...shadows.medium,
  },
  soldItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  soldItemCard: {
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  soldItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  soldItemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  soldItemPrice: {
    alignItems: 'flex-end',
  },
  bottomSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  confirmButton: {
    marginTop: spacing.sm,
  },
});

export default ExactPricingScreen;
