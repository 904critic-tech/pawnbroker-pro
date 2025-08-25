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
  Searchbar,
  Card,
  Button,
  IconButton,
  Surface,
  useTheme,
  Chip,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';
import { marketplaceService } from '../services/MarketplaceService';

interface ProductMatch {
  id: string;
  title: string;
  brand?: string;
  model?: string;
  category: string;
  condition: string;
  estimatedMarketValue: number;
  dataPoints: number;
  confidence: number;
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
  recentSales: Array<{
    title: string;
    price: number;
    soldDate: string;
    condition: string;
  }>;
}

const ProductSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  
  const searchQuery = route.params?.searchQuery || '';
  const [products, setProducts] = useState<ProductMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductMatch | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery) {
      loadProductMatches();
    }
  }, [searchQuery]);

  const loadProductMatches = async () => {
    try {
      setIsLoading(true);
      
      // Get comprehensive market data to find multiple product matches
      const comprehensiveData = await marketplaceService.getComprehensiveMarketData(searchQuery);
      
      // Extract different product variations from the data
      const productMatches = extractProductMatches(comprehensiveData, searchQuery);
      
      setProducts(productMatches);
      
    } catch (error) {
      console.error('Failed to load product matches:', error);
      Alert.alert('Error', 'Failed to load product matches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractProductMatches = (data: any, query: string): ProductMatch[] => {
    const matches: ProductMatch[] = [];
    
    // Extract from eBay data if available
    if (data.sources?.ebay?.data?.items) {
      const items = data.sources.ebay.data.items;
      
      // Group items by similar titles/models
      const groupedItems = groupSimilarItems(items);
      
      groupedItems.forEach((group, index) => {
        const avgPrice = group.reduce((sum, item) => sum + item.price, 0) / group.length;
        const prices = group.map(item => item.price);
        
        matches.push({
          id: `ebay-${index}`,
          title: group[0].title,
          brand: extractBrand(group[0].title),
          model: extractModel(group[0].title),
          category: 'Electronics', // Default, could be improved
          condition: 'Used',
          estimatedMarketValue: Math.round(avgPrice),
          dataPoints: group.length,
          confidence: Math.min(group.length / 10, 0.95),
          priceRange: {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.round(avgPrice)
          },
          recentSales: group.slice(0, 5).map(item => ({
            title: item.title,
            price: item.price,
            soldDate: item.soldDate,
            condition: item.condition
          }))
        });
      });
    }
    
    // If no eBay data, create a generic match
    if (matches.length === 0) {
      matches.push({
        id: 'generic-1',
        title: query,
        category: 'Unknown',
        condition: 'Used',
        estimatedMarketValue: data.aggregatedData?.primaryMarketData?.marketValue || 0,
        dataPoints: data.aggregatedData?.primaryMarketData?.dataPoints || 0,
        confidence: data.aggregatedData?.primaryMarketData?.confidence || 0,
        priceRange: data.aggregatedData?.primaryMarketData?.priceRange || { min: 0, max: 0, avg: 0 },
        recentSales: []
      });
    }
    
    return matches;
  };

  const groupSimilarItems = (items: any[]): any[][] => {
    const groups: any[][] = [];
    const processed = new Set();
    
    items.forEach((item, index) => {
      if (processed.has(index)) return;
      
      const group = [item];
      processed.add(index);
      
      // Find similar items
      items.forEach((otherItem, otherIndex) => {
        if (processed.has(otherIndex)) return;
        
        if (isSimilarItem(item, otherItem)) {
          group.push(otherItem);
          processed.add(otherIndex);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  };

  const isSimilarItem = (item1: any, item2: any): boolean => {
    const title1 = item1.title.toLowerCase();
    const title2 = item2.title.toLowerCase();
    
    // Check for common brand/model patterns
    const brand1 = extractBrand(title1);
    const brand2 = extractBrand(title2);
    const model1 = extractModel(title1);
    const model2 = extractModel(title2);
    
    return brand1 && brand2 && brand1 === brand2 && 
           model1 && model2 && model1 === model2;
  };

  const extractBrand = (title: string): string | undefined => {
    const brands = ['apple', 'samsung', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'sony', 'lg'];
    const lowerTitle = title.toLowerCase();
    
    for (const brand of brands) {
      if (lowerTitle.includes(brand)) {
        return brand.charAt(0).toUpperCase() + brand.slice(1);
      }
    }
    
    return undefined;
  };

  const extractModel = (title: string): string | undefined => {
    // Common model patterns
    const patterns = [
      /(iphone\s+\d+)/i,
      /(macbook\s+(pro|air))/i,
      /(dell\s+\w+)/i,
      /(hp\s+\w+)/i,
      /(lenovo\s+\w+)/i,
      /(asus\s+\w+)/i,
      /(acer\s+\w+)/i
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  };

  const handleProductSelect = (product: ProductMatch) => {
    setSelectedProduct(product);
  };

  const handleConfirmSelection = () => {
    if (!selectedProduct) {
      Alert.alert('Please select a product');
      return;
    }

    // Create the item object with the selected product details
    const item = {
      id: Date.now().toString(),
      name: selectedProduct.title,
      category: selectedProduct.category,
      brand: selectedProduct.brand || 'Unknown',
      model: selectedProduct.model || 'Unknown',
      condition: selectedProduct.condition,
      marketValue: selectedProduct.estimatedMarketValue,
      pawnValue: Math.round(selectedProduct.estimatedMarketValue * 0.3),
      confidence: selectedProduct.confidence,
      searchResults: selectedProduct.recentSales,
      priceRange: selectedProduct.priceRange,
      dataPoints: selectedProduct.dataPoints,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SET_CURRENT_ITEM', payload: item });
    navigation.navigate('ItemConfirmation' as never);
  };

  const renderProductCard = ({ item }: { item: ProductMatch }) => (
    <Card
      style={[
        styles.productCard,
        { backgroundColor: colors.surface },
        selectedProduct?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
      ]}
    >
      <TouchableOpacity onPress={() => handleProductSelect(item)}>
        <Card.Content>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
                {item.title}
              </Text>
              {item.brand && (
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {item.brand} {item.model}
                </Text>
              )}
            </View>
            <View style={styles.priceInfo}>
              <Text variant="titleLarge" style={{ color: colors.primary, fontWeight: 'bold' }}>
                ${item.estimatedMarketValue}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {item.dataPoints} sales
              </Text>
            </View>
          </View>
          
          <View style={styles.productDetails}>
            <Chip mode="outlined" style={styles.chip}>
              {item.condition}
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              {Math.round(item.confidence * 100)}% confidence
            </Chip>
          </View>
          
          <View style={styles.priceRange}>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              Price range: ${item.priceRange.min} - ${item.priceRange.max}
            </Text>
          </View>
          
          {showDetails === item.id && item.recentSales.length > 0 && (
            <View style={styles.recentSales}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, marginBottom: spacing.sm }}>
                Recent Sales:
              </Text>
              {item.recentSales.map((sale, index) => (
                <View key={index} style={styles.saleItem}>
                  <Text variant="bodySmall" style={{ color: colors.onSurface, flex: 1 }}>
                    {sale.title.length > 50 ? sale.title.substring(0, 50) + '...' : sale.title}
                  </Text>
                  <Text variant="bodySmall" style={{ color: colors.primary, fontWeight: '600' }}>
                    ${sale.price}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          <TouchableOpacity
            onPress={() => setShowDetails(showDetails === item.id ? null : item.id)}
            style={styles.detailsButton}
          >
            <Text variant="bodySmall" style={{ color: colors.primary }}>
              {showDetails === item.id ? 'Hide Details' : 'Show Details'}
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          iconColor={colors.onBackground}
        />
        <Text variant="headlineSmall" style={{ color: colors.onBackground, flex: 1 }}>
          Select Product
        </Text>
      </View>
      
      <View style={styles.searchInfo}>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          Search: "{searchQuery}"
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          Found {products.length} product variation{products.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading product matches...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={products}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productList}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.bottomSection}>
            <Button
              mode="contained"
              onPress={handleConfirmSelection}
              disabled={!selectedProduct}
              style={styles.confirmButton}
            >
              Confirm Selection
            </Button>
          </View>
        </>
      )}
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
  searchInfo: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    padding: spacing.lg,
  },
  productCard: {
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  productInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  productDetails: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  chip: {
    marginRight: spacing.sm,
  },
  priceRange: {
    marginBottom: spacing.sm,
  },
  recentSales: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailsButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  bottomSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  confirmButton: {
    marginTop: spacing.sm,
  },
});

export default ProductSelectionScreen;
