import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Card,
  Button,
  IconButton,
  Surface,
  useTheme,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';
import { marketplaceService } from '../services/MarketplaceService';
import LearningService from '../services/LearningService';

const { width } = Dimensions.get('window');

const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, dispatch, canMakeQuery, incrementQueryCount } = useApp();
  const { colors } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const learningService = LearningService.getInstance();

  const categories = [
    'Electronics',
    'Jewelry',
    'Tools',
    'Musical Instruments',
    'Sports Equipment',
    'Collectibles',
    'Antiques',
    'Furniture',
    'Clothing',
    'Books',
    'Other',
  ];

  const popularItems = [
    { name: 'iPhone 13 Pro', category: 'Electronics', icon: 'cellphone' },
    { name: 'Gold Ring', category: 'Jewelry', icon: 'ring' },
    { name: 'Guitar', category: 'Musical Instruments', icon: 'music' },
    { name: 'Diamond Necklace', category: 'Jewelry', icon: 'diamond-stone' },
    { name: 'Power Tools', category: 'Tools', icon: 'hammer-wrench' },
    { name: 'Gaming Console', category: 'Electronics', icon: 'gamepad-variant' },
  ];

  const handleSearch = async () => {
    console.log('🔍 Search button pressed for:', searchQuery);
    
    if (!searchQuery.trim()) {
      console.log('❌ Empty search query');
      return;
    }

    // Check query limit
    if (!canMakeQuery()) {
      console.log('❌ Query limit reached');
      Alert.alert(
        'Daily Limit Reached',
        'You have reached your daily limit of 5 queries. Watch an ad for 3 more queries or upgrade to Pro for unlimited access.',
        [
          { text: 'Watch Ad', onPress: () => console.log('Show rewarded ad') },
          { text: 'Upgrade', onPress: () => console.log('Navigate to upgrade') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      console.log('🚀 Starting search...');
      setIsSearching(true);
      dispatch({ type: 'SET_LOADING', payload: true });

      // Increment query count
      incrementQueryCount();
      console.log('✅ Query count incremented');

      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      }

      console.log('📡 Calling marketplace service...');
      // Use the marketplace service to get a real estimate
      const estimate = await marketplaceService.getQuickMarketEstimate(searchQuery);
      console.log('✅ Got estimate:', estimate);
      
      // Use LearningService to extract brand and model from the search query
      console.log('🔍 Attempting to extract brand/model from:', searchQuery);
      const { brand, model } = learningService.extractBrandAndModelFromTitle(searchQuery);
      console.log('🔍 Extracted brand:', brand, 'model:', model);
      console.log('🔍 LearningService result details:', { brand, model, query: searchQuery });
      
      // Convert to the format expected by the app
      const item = {
        id: Date.now().toString(),
        name: searchQuery,
        category: 'Electronics', // Default category
        brand: brand || 'Unknown',
        model: model || 'Unknown',
        condition: 'Used',
        marketValue: estimate.marketValue,
        pawnValue: estimate.pawnValue,
        confidence: estimate.confidence,
        searchResults: [], // Marketplace service doesn't return individual sales
        createdAt: new Date().toISOString(),
      };

      console.log('📦 Created item object:', item);
      setSearchResults([item]);
      
      if (item) {
        console.log('🎯 Navigating to brand selection...');
        // Navigate to brand selection screen for hierarchical search
        (navigation as any).navigate('BrandSelection', { searchQuery });
        console.log('✅ Navigation completed');
      }

         } catch (error) {
       console.error('❌ Search failed:', error);
       
       // Show user-friendly error message
       let errorMessage = 'Search failed. Please try again.';
       
       if (error instanceof Error) {
         if (error.message.includes('Network request failed')) {
           errorMessage = 'Network error. Please check your connection and try again.';
         } else if (error.message.includes('Failed to get pricing estimate')) {
           errorMessage = 'No market data found for this item. Try a different search term.';
         } else {
           errorMessage = error.message;
         }
       }
       
       Alert.alert('Search Error', errorMessage, [{ text: 'OK' }]);
     } finally {
      console.log('🏁 Search completed, cleaning up...');
      setIsSearching(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handlePopularItemSelect = (item: any) => {
    setSearchQuery(item.name);
    setSelectedCategory(item.category);
  };

  const handleRecentSearchSelect = (search: string) => {
    setSearchQuery(search);
  };

  const renderCategoryChip = (category: string) => (
    <Chip
      key={category}
      selected={selectedCategory === category}
      onPress={() => handleCategorySelect(category)}
      style={styles.categoryChip}
      mode="outlined"
    >
      {category}
    </Chip>
  );

  const renderPopularItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.popularItemCard, { backgroundColor: colors.surface }]}
      onPress={() => handlePopularItemSelect(item)}
    >
      <IconButton icon={item.icon} size={24} iconColor={colors.primary} />
      <View style={styles.popularItemContent}>
        <Text variant="titleSmall" style={{ color: colors.onSurface }}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          {item.category}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchSelect(item)}
    >
      <IconButton icon="history" size={20} iconColor={colors.onSurfaceVariant} />
      <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ color: colors.onBackground }}>
            Search Items
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            Find items by name or description
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search for items..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onSubmitEditing={handleSearch}
            loading={isSearching}
            style={[styles.searchBar, { backgroundColor: colors.surface }]}
          />
          <Button
            mode="contained"
            onPress={handleSearch}
            loading={isSearching}
            disabled={!searchQuery.trim() || isSearching}
            style={styles.searchButton}
          >
            Search
          </Button>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Categories
          </Text>
          <View style={styles.categoriesContainer}>
            {categories.map(renderCategoryChip)}
          </View>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onBackground }]}>
              Recent Searches
            </Text>
                         <Surface style={[styles.recentSearchesCard, { backgroundColor: colors.surface }]}>
               {recentSearches.map((search, index) => (
                 <TouchableOpacity
                   key={index}
                   style={styles.recentSearchItem}
                   onPress={() => handleRecentSearchSelect(search)}
                 >
                   <IconButton icon="history" size={20} iconColor={colors.onSurfaceVariant} />
                   <Text variant="bodyMedium" style={{ color: colors.onSurface, flex: 1 }}>
                     {search}
                   </Text>
                 </TouchableOpacity>
               ))}
             </Surface>
          </View>
        )}

        {/* Popular Items */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Popular Items
          </Text>
          <FlatList
            data={popularItems}
            renderItem={renderPopularItem}
            keyExtractor={(item) => item.name}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularItemsContainer}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Surface style={[styles.quickActionsCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleMedium" style={[styles.quickActionsTitle, { color: colors.onSurface }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
                             <TouchableOpacity
                 style={[styles.quickAction, { backgroundColor: colors.primaryContainer }]}
                 onPress={() => navigation.navigate('MarketplaceTest' as never)}
               >
                 <IconButton icon="test-tube" size={32} iconColor={colors.primary} />
                 <Text variant="labelMedium" style={{ color: colors.primary, textAlign: 'center' }}>
                   Test API
                 </Text>
               </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.secondaryContainer }]}
                onPress={() => navigation.navigate('History' as never)}
              >
                <IconButton icon="history" size={32} iconColor={colors.secondary} />
                <Text variant="labelMedium" style={{ color: colors.secondary, textAlign: 'center' }}>
                  View History
                </Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBar: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  searchButton: {
    marginTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    marginBottom: spacing.xs,
  },
  recentSearchesCard: {
    borderRadius: theme.roundness,
    ...shadows.small,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  popularItemsContainer: {
    paddingRight: spacing.lg,
  },
  popularItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginRight: spacing.md,
    borderRadius: theme.roundness,
    minWidth: 200,
    ...shadows.small,
  },
  popularItemContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  quickActionsCard: {
    padding: spacing.lg,
    borderRadius: theme.roundness,
    ...shadows.medium,
  },
  quickActionsTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2, // Two columns with gap
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginBottom: spacing.sm,
  },
});

export default SearchScreen;
