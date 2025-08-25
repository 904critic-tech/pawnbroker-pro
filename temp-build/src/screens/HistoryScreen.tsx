import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Surface,
  useTheme,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, clearHistory } = useApp();
  const { colors } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'electronics' | 'jewelry' | 'tools'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'name'>('date');
  const [showMenu, setShowMenu] = useState(false);

  const filters = [
    { key: 'all', label: 'All Items' },
    { key: 'electronics', label: 'Electronics' },
    { key: 'jewelry', label: 'Jewelry' },
    { key: 'tools', label: 'Tools' },
  ];

  const sortOptions = [
    { key: 'date', label: 'Date' },
    { key: 'value', label: 'Value' },
    { key: 'name', label: 'Name' },
  ];

  const filteredAndSortedItems = state.searchHistory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || item.category.toLowerCase() === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'value':
          return b.marketValue - a.marketValue;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleItemPress = (item: any) => {
    // Navigate to results with this item
    navigation.navigate('Results' as never, { item } as never);
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.historyItem, { backgroundColor: colors.surface }]}
      onPress={() => handleItemPress(item)}
    >
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.itemThumbnail} resizeMode="cover" />
      )}
      
      <View style={styles.itemContent}>
        <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          {item.category} • {item.condition}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      <View style={styles.itemValues}>
        <Text variant="labelMedium" style={{ color: colors.marketValue }}>
          ${item.marketValue}
        </Text>
        <Text variant="labelSmall" style={{ color: colors.pawnValue }}>
          Offer: ${item.pawnValue}
        </Text>
      </View>
      
      <IconButton icon="chevron-right" size={20} iconColor={colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconButton icon="history" size={64} iconColor={colors.onSurfaceVariant} />
      <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.sm }}>
        No History Yet
      </Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
        Your pricing history will appear here after you complete your first estimate.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: colors.onBackground }}>
          Pricing History
        </Text>
        <View style={styles.headerActions}>
          <Menu
            visible={showMenu}
            onDismiss={() => setShowMenu(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setShowMenu(true)}
                iconColor={colors.onSurface}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setShowMenu(false);
                handleClearHistory();
              }}
              title="Clear History"
              leadingIcon="delete"
            />
          </Menu>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search history..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surface }]}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <Chip
              key={filter.key}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key as any)}
              style={styles.filterChip}
              mode="outlined"
            >
              {filter.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.sortSection}>
        <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
          Sort by:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {sortOptions.map((option) => (
            <Chip
              key={option.key}
              selected={sortBy === option.key}
              onPress={() => setSortBy(option.key as any)}
              style={styles.sortChip}
              mode="outlined"
            >
              {option.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* History List */}
      <View style={styles.listSection}>
        {filteredAndSortedItems.length > 0 ? (
          <FlatList
            data={filteredAndSortedItems}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Summary Stats */}
      {filteredAndSortedItems.length > 0 && (
        <Surface style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.md }}>
            Summary
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                Total Items
              </Text>
              <Text variant="titleMedium" style={{ color: colors.onSurface }}>
                {filteredAndSortedItems.length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                Total Value
              </Text>
              <Text variant="titleMedium" style={{ color: colors.marketValue }}>
                ${filteredAndSortedItems.reduce((sum, item) => sum + item.marketValue, 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                Total Offers
              </Text>
              <Text variant="titleMedium" style={{ color: colors.pawnValue }}>
                ${filteredAndSortedItems.reduce((sum, item) => sum + item.pawnValue, 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </Surface>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    ...shadows.small,
  },
  filtersSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  sortSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sortChip: {
    marginLeft: spacing.sm,
  },
  listSection: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: theme.roundness,
    ...shadows.small,
  },
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: theme.roundness,
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemValues: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  summaryCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: theme.roundness,
    ...shadows.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
});

export default HistoryScreen;
