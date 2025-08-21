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
  
  const searchQuery = route.params?.searchQuery || '';
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
      
      // Get comprehensive market data to extract brands
      const comprehensiveData = await marketplaceService.getComprehensiveMarketData(searchQuery);
      
      // Learn from the search results
      if (comprehensiveData.sources?.ebay?.data?.items) {
        await learningService.learnFromSearch(searchQuery, comprehensiveData.sources.ebay.data.items);
      }
      
      // Extract brands from the data
      const extractedBrands = extractBrandsFromData(comprehensiveData, searchQuery);
      
      setBrands(extractedBrands);
      
    } catch (error) {
      console.error('Failed to load brands:', error);
      Alert.alert('Error', 'Failed to load brands. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractBrandsFromData = (data: any, query: string): Brand[] => {
    const brandMap = new Map<string, { items: any[], totalPrice: number }>();
    
    // Extract from eBay data if available
    if (data.sources?.ebay?.data?.items) {
      const items = data.sources.ebay.data.items;
      
      items.forEach((item: any) => {
        // Use the comprehensive learning system to extract brand
        const { brand } = learningService.extractBrandAndModelFromTitle(item.title);
        if (brand) {
          if (!brandMap.has(brand)) {
            brandMap.set(brand, { items: [], totalPrice: 0 });
          }
          brandMap.get(brand)!.items.push(item);
          brandMap.get(brand)!.totalPrice += item.price;
        }
      });
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
    navigation.navigate('ModelSelection' as never, {
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
                {item.itemCount} items available
              </Text>
            </View>
            <View style={styles.brandStats}>
              <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
                ${item.avgPrice}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                avg price
              </Text>
            </View>
          </View>
          
          <View style={styles.brandDetails}>
            <Chip mode="outlined" style={styles.chip}>
              {Math.round(item.confidence * 100)}% confidence
            </Chip>
            <Chip mode="outlined" style={styles.chip}>
              {item.itemCount} listings
            </Chip>
          </View>
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
          Found {brands.length} brand{brands.length !== 1 ? 's' : ''}
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
