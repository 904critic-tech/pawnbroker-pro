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
  Searchbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';
import { marketplaceService } from '../services/MarketplaceService';
import LearningService from '../services/LearningService';

interface Brand {
  id: string;
  name: string;
  logo?: string;
  itemCount: number;
  avgPrice: number;
  confidence: number;
}

const BrandSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  
  const searchQuery = (route.params as any)?.searchQuery || '';
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [searchText, setSearchText] = useState('');

  const learningService = LearningService.getInstance();

  useEffect(() => {
    if (searchQuery) {
      loadBrands();
    }
  }, [searchQuery]);

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      
      // Get the actual eBay listings to extract real brand options
      const comprehensiveData = await marketplaceService.getComprehensiveMarketData(searchQuery);
      
      // Extract brands from the actual eBay listings
      const extractedBrands = extractBrandsFromListings(comprehensiveData, searchQuery);
      

      setBrands(extractedBrands);
      
    } catch (error) {
      console.error('Failed to load brands:', error);
      Alert.alert('Error', 'Failed to load brands. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractBrandsFromListings = (data: any, query: string): Brand[] => {
    const brandMap = new Map<string, { items: any[], totalPrice: number, titles: string[] }>();
    
    // Extract from eBay data if available (check both scraper and API)
    if (data.sources?.ebay?.data?.recentSales) {
      const items = data.sources.ebay.data.recentSales;
      
      items.forEach((item: any) => {
        // Extract brand from the actual listing title
        const { brand } = learningService.extractBrandAndModelFromTitle(item.title);
        
        if (brand && brand !== 'Unknown') {
          if (!brandMap.has(brand)) {
            brandMap.set(brand, { items: [], totalPrice: 0, titles: [] });
          }
          brandMap.get(brand)!.items.push(item);
          brandMap.get(brand)!.totalPrice += item.price;
          brandMap.get(brand)!.titles.push(item.title);
        }
      });
    } else if (data.sources?.ebayApi?.data?.recentSales) {
      const items = data.sources.ebayApi.data.recentSales;
      
      items.forEach((item: any) => {
        // Extract brand from the actual listing title
        const { brand } = learningService.extractBrandAndModelFromTitle(item.title);
        
        if (brand && brand !== 'Unknown') {
          if (!brandMap.has(brand)) {
            brandMap.set(brand, { items: [], totalPrice: 0, titles: [] });
          }
          brandMap.get(brand)!.items.push(item);
          brandMap.get(brand)!.totalPrice += item.price;
          brandMap.get(brand)!.titles.push(item.title);
        }
      });
    }
    
    // Convert to Brand objects with real data
    const brands: Brand[] = [];
    brandMap.forEach((data, brandName) => {
      const avgPrice = data.totalPrice / data.items.length;
      const confidence = Math.min(data.items.length / 10, 0.95); // Higher confidence with more items
      
      brands.push({
        id: brandName.toLowerCase().replace(/\s+/g, '-'),
        name: brandName,
        itemCount: data.items.length,
        avgPrice: Math.round(avgPrice),
        confidence: Math.max(confidence, 0.3), // Minimum 30% confidence
      });
    });
    
    // Sort by item count (most popular first)
    brands.sort((a, b) => b.itemCount - a.itemCount);
    
    return brands;
  };

  const extractBrandsFromData = (data: any, query: string): Brand[] => {
    const brandMap = new Map<string, { items: any[], totalPrice: number }>();
    
    // Extract from eBay data if available (check both scraper and API)
    if (data.sources?.ebay?.data?.recentSales) {
      const items = data.sources.ebay.data.recentSales;
      
      items.forEach((item: any) => {
        // Use the comprehensive learning system to extract brand
        const { brand } = learningService.extractBrandAndModelFromTitle(item.title);
        if (brand && brand !== 'Unknown') {
          if (!brandMap.has(brand)) {
            brandMap.set(brand, { items: [], totalPrice: 0 });
          }
          brandMap.get(brand)!.items.push(item);
          brandMap.get(brand)!.totalPrice += item.price;
        }
      });
    } else if (data.sources?.ebayApi?.data?.recentSales) {
      const items = data.sources.ebayApi.data.recentSales;
      
      items.forEach((item: any) => {
        // Use the comprehensive learning system to extract brand
        const { brand } = learningService.extractBrandAndModelFromTitle(item.title);
        if (brand && brand !== 'Unknown') {
          if (!brandMap.has(brand)) {
            brandMap.set(brand, { items: [], totalPrice: 0 });
          }
          brandMap.get(brand)!.items.push(item);
          brandMap.get(brand)!.totalPrice += item.price;
        }
      });
    }
    
    // Also try to extract from the search query itself
    const { brand: queryBrand } = learningService.extractBrandAndModelFromTitle(query);
    if (queryBrand && queryBrand !== 'Unknown' && !brandMap.has(queryBrand)) {
      brandMap.set(queryBrand, { items: [], totalPrice: 0 });
    }
    
    // Convert to Brand objects
    const brands: Brand[] = [];
    brandMap.forEach((data, brandName) => {
      const avgPrice = data.totalPrice / data.items.length;
      brands.push({
        id: brandName.toLowerCase().replace(/\s+/g, '-'),
        name: brandName,
        itemCount: data.items.length,
        avgPrice: Math.round(avgPrice),
        confidence: Math.min(data.items.length / 5, 0.95),
      });
    });
    
    // Sort by item count (most popular first)
    brands.sort((a, b) => b.itemCount - a.itemCount);
    
    // Return only real brands found in the data - no fallback mock data
    return brands;
  };

  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
  };

  const handleContinue = () => {
    if (!selectedBrand) {
      Alert.alert('Please select a brand');
      return;
    }

    // Navigate to model selection with brand info
    (navigation as any).navigate('ModelSelection', {
      searchQuery,
      selectedBrand: selectedBrand.name,
    });
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderBrandCard = ({ item }: { item: Brand }) => (
    <Card
      style={[
        styles.brandCard,
        { backgroundColor: colors.surface },
        selectedBrand?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
      ]}
    >
      <TouchableOpacity onPress={() => handleBrandSelect(item)}>
        <Card.Content>
          <View style={styles.brandHeader}>
            <View style={styles.brandInfo}>
              <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: '600' }}>
                {item.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                {item.itemCount} recent sales found
              </Text>
            </View>
            <View style={styles.brandStats}>
              <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
                ${item.avgPrice.toLocaleString()}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                average sold price
              </Text>
            </View>
          </View>
          
          <View style={styles.brandDetails}>
            <Chip mode="outlined" style={styles.chip}>
              {Math.round(item.confidence * 100)}% confidence
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              {item.itemCount} eBay listings
            </Chip>
          </View>
          
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing.sm }}>
            Based on actual sold listings from eBay
          </Text>
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
          Select Brand
        </Text>
      </View>
      
      <View style={styles.searchInfo}>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          Search: "{searchQuery}"
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          Found {brands.length} brand{brands.length !== 1 ? 's' : ''} from recent eBay sales
        </Text>
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search brands..."
          onChangeText={setSearchText}
          value={searchText}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading brands...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredBrands}
            renderItem={renderBrandCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.brandList}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.bottomSection}>
            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={!selectedBrand}
              style={styles.continueButton}
            >
              Continue to Models
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
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    ...shadows.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandList: {
    padding: spacing.lg,
  },
  brandCard: {
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  brandInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  brandStats: {
    alignItems: 'flex-end',
  },
  brandDetails: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  chip: {
    marginRight: spacing.sm,
  },
  bottomSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
});

export default BrandSelectionScreen;
