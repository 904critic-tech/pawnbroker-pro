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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type ModelSelectionRouteParams = {
  searchQuery: string;
  selectedBrand: string;
};
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';
import { marketplaceService } from '../services/MarketplaceService';
import LearningService from '../services/LearningService';

interface Model {
  id: string;
  name: string;
  fullName: string;
  itemCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  specs?: {
    year?: string;
    storage?: string;
    ram?: string;
    color?: string;
    condition?: string;
  };
}

const ModelSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{params: ModelSelectionRouteParams}, 'params'>>();
  const { state, dispatch } = useApp();
  const { colors } = useTheme();
  
  const searchQuery = route.params?.searchQuery || '';
  const selectedBrand = route.params?.selectedBrand || '';
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [searchText, setSearchText] = useState('');

  const learningService = LearningService.getInstance();

  useEffect(() => {
    if (searchQuery && selectedBrand) {
      loadModels();
    }
  }, [searchQuery, selectedBrand]);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      
      // Search for the specific brand + category combination
      const searchTerm = `${selectedBrand} ${searchQuery}`;
      const comprehensiveData = await marketplaceService.getComprehensiveMarketData(searchTerm);
      
      // Learn from the search results
      if (comprehensiveData.sources?.ebay?.data?.items) {
        await learningService.learnFromSearch(searchTerm, comprehensiveData.sources.ebay.data.items);
      }
      
      // Extract models from the data
      const extractedModels = extractModelsFromData(comprehensiveData, selectedBrand);
      
      setModels(extractedModels);
      
    } catch (error) {
      console.error('Failed to load models:', error);
      Alert.alert('Error', 'Failed to load models. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractModelsFromData = (data: any, brand: string): Model[] => {
    const modelMap = new Map<string, { items: any[], totalPrice: number, prices: number[] }>();
    
    // Extract from eBay data if available
    if (data.sources?.ebay?.data?.items) {
      const items = data.sources.ebay.data.items;
      
      items.forEach((item: any) => {
        // Use the comprehensive learning system to extract model
        const { model } = learningService.extractBrandAndModelFromTitle(item.title);
        if (model) {
          const modelKey = model.toLowerCase();
          if (!modelMap.has(modelKey)) {
            modelMap.set(modelKey, { items: [], totalPrice: 0, prices: [] });
          }
          modelMap.get(modelKey)!.items.push(item);
          modelMap.get(modelKey)!.totalPrice += item.price;
          modelMap.get(modelKey)!.prices.push(item.price);
        }
      });
    }
    
    // Convert to Model objects
    const models: Model[] = [];
    modelMap.forEach((data, modelKey) => {
      const avgPrice = data.totalPrice / data.items.length;
      const prices = data.prices.sort((a, b) => a - b);
      
      models.push({
        id: modelKey,
        name: data.items[0] ? learningService.extractBrandAndModelFromTitle(data.items[0].title).model || 'Unknown' : 'Unknown',
        fullName: data.items[0] ? data.items[0].title : 'Unknown Model',
        itemCount: data.items.length,
        avgPrice: Math.round(avgPrice),
        minPrice: Math.round(prices[0]),
        maxPrice: Math.round(prices[prices.length - 1]),
        confidence: Math.min(data.items.length / 3, 0.95),
        specs: extractSpecsFromTitle(data.items[0]?.title || ''),
      });
    });
    
    // Sort by item count (most popular first)
    models.sort((a, b) => b.itemCount - a.itemCount);
    
    // Return only real models found in the data - no fallback mock data
    return models;
  };

  const extractModelFromTitle = (title: string, brand: string): { name: string, specs?: any } | null => {
    // Use the comprehensive learning system to extract model
    const { model } = learningService.extractBrandAndModelFromTitle(title);
    if (model) {
      return {
        name: model,
        specs: extractSpecsFromTitle(title),
      };
    }
    
    return null;
  };

  const extractSpecsFromTitle = (title: string): any => {
    const specs: any = {};
    const lowerTitle = title.toLowerCase();
    
    // Extract year
    const yearMatch = lowerTitle.match(/(20\d{2})/);
    if (yearMatch) specs.year = yearMatch[1];
    
    // Extract storage
    const storageMatch = lowerTitle.match(/(\d+)\s*(gb|tb)/i);
    if (storageMatch) specs.storage = `${storageMatch[1]}${storageMatch[2].toUpperCase()}`;
    
    // Extract RAM
    const ramMatch = lowerTitle.match(/(\d+)\s*gb\s*ram/i);
    if (ramMatch) specs.ram = `${ramMatch[1]}GB RAM`;
    
    // Extract color
    const colors = ['black', 'white', 'silver', 'gold', 'blue', 'red', 'green'];
    for (const color of colors) {
      if (lowerTitle.includes(color)) {
        specs.color = color.charAt(0).toUpperCase() + color.slice(1);
        break;
      }
    }
    
    // Extract condition
    if (lowerTitle.includes('new')) specs.condition = 'New';
    else if (lowerTitle.includes('used')) specs.condition = 'Used';
    else if (lowerTitle.includes('refurbished')) specs.condition = 'Refurbished';
    
    return specs;
  };

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
  };

  const handleContinue = () => {
    if (!selectedModel) {
      Alert.alert('Please select a model');
      return;
    }

    // Navigate to exact product pricing with model info
    (navigation as any).navigate('ExactPricing', {
      searchQuery,
      selectedBrand,
      selectedModel: selectedModel.name,
      modelFullName: selectedModel.fullName,
    });
  };

  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchText.toLowerCase()) ||
    model.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderModelCard = ({ item }: { item: Model }) => (
    <Card
      style={[
        styles.modelCard,
        { backgroundColor: colors.surface },
        selectedModel?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
      ]}
    >
      <TouchableOpacity onPress={() => handleModelSelect(item)}>
        <Card.Content>
          <View style={styles.modelHeader}>
            <View style={styles.modelInfo}>
              <Text variant="titleLarge" style={{ color: colors.onSurface, fontWeight: '600' }}>
                {item.name}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                {item.itemCount} items available
              </Text>
            </View>
            <View style={styles.modelStats}>
              <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: 'bold' }}>
                ${item.avgPrice}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                avg price
              </Text>
            </View>
          </View>
          
          <View style={styles.priceRange}>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              Price range: ${item.minPrice} - ${item.maxPrice}
            </Text>
          </View>
          
          {item.specs && Object.keys(item.specs).length > 0 && (
            <View style={styles.specsContainer}>
              {Object.entries(item.specs).map(([key, value]) => (
                <Chip key={key} mode="outlined" style={styles.specChip}>
                  {key}: {value}
                </Chip>
              ))}
            </View>
          )}
          
          <View style={styles.modelDetails}>
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
          Select Model
        </Text>
      </View>
      
      <View style={styles.searchInfo}>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
          {selectedBrand} {searchQuery}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          Found {models.length} model{models.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search models..."
          onChangeText={setSearchText}
          value={searchText}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading models...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredModels}
            renderItem={renderModelCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modelList}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.bottomSection}>
            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={!selectedModel}
              style={styles.continueButton}
            >
              Get Exact Pricing
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
  modelList: {
    padding: spacing.lg,
  },
  modelCard: {
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  modelInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  modelStats: {
    alignItems: 'flex-end',
  },
  priceRange: {
    marginBottom: spacing.sm,
  },
  specsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  specChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  modelDetails: {
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

export default ModelSelectionScreen;
