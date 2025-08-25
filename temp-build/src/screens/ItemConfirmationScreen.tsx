import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  SegmentedButtons,
  Surface,
  useTheme,
  Chip,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';

const ItemConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, dispatch, addItemToHistory, calculatePawnValue } = useApp();
  const { colors } = useTheme();
  
  const [itemName, setItemName] = useState(state.currentItem?.name || '');
  const [brand, setBrand] = useState(state.currentItem?.brand || '');
  const [model, setModel] = useState(state.currentItem?.model || '');
  const [category, setCategory] = useState(state.currentItem?.category || '');
  const [condition, setCondition] = useState(state.currentItem?.condition || 'good');
  const [notes, setNotes] = useState('');

  const conditions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

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

  const handleConfirm = async () => {
    if (!itemName.trim()) {
      // Show error
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Use the real market data that was already calculated in SearchScreen
      // Only recalculate if we don't have market data or if item details changed significantly
      let marketValue = state.currentItem?.marketValue;
      let pawnValue = state.currentItem?.pawnValue;
      let confidence = state.currentItem?.confidence;

      // If we have real market data, use it; otherwise show a message
      if (!marketValue || marketValue === 0) {
        // No real data available
        Alert.alert(
          'No Market Data Available',
          'We couldn\'t find recent sales data for this item. Please try a different search term or check back later.',
          [{ text: 'OK' }]
        );
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const updatedItem = {
        ...state.currentItem!,
        name: itemName,
        brand: brand || undefined,
        model: model || undefined,
        category,
        condition: condition as any,
        marketValue,
        pawnValue,
        confidence,
        createdAt: new Date(),
      };

      dispatch({ type: 'SET_CURRENT_ITEM', payload: updatedItem });
      addItemToHistory(updatedItem);
      navigation.navigate('Results' as never);
      
    } catch (error) {
      console.error('❌ Item confirmation failed:', error);
      Alert.alert(
        'Confirmation Failed',
        'Failed to confirm item. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (!state.currentItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text variant="headlineSmall" style={{ color: colors.onBackground }}>
            No Item Selected
          </Text>
          <Button mode="contained" onPress={handleBack} style={{ marginTop: spacing.md }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton icon="arrow-left" size={24} onPress={handleBack} />
            <Text variant="headlineMedium" style={{ color: colors.onBackground, flex: 1 }}>
              Confirm Item
            </Text>
          </View>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            Review and adjust item details before pricing
          </Text>
        </View>

        {/* Item Image */}
        {state.currentItem.imageUrl && (
          <View style={styles.imageSection}>
            <Surface style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
              <Image
                source={{ uri: state.currentItem.imageUrl }}
                style={styles.itemImage}
                resizeMode="contain"
              />
            </Surface>
          </View>
        )}

        {/* Pricing Display */}
        {state.currentItem?.marketValue && (
          <View style={styles.pricingSection}>
            <Surface style={[styles.pricingCard, { backgroundColor: colors.surface }]}>
              <Text variant="titleLarge" style={[styles.pricingTitle, { color: colors.onSurface }]}>
                Pricing Estimate
              </Text>
              
              <View style={styles.pricingRow}>
                <View style={styles.pricingItem}>
                  <Text variant="headlineMedium" style={{ color: colors.primary, fontWeight: 'bold', textAlign: 'center' }}>
                    ${state.currentItem.marketValue}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                    Market Value
                  </Text>
                  {state.currentItem.dataPoints && (
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs }}>
                      Based on {state.currentItem.dataPoints} sales
                    </Text>
                  )}
                </View>
                
                <View style={styles.pricingItem}>
                  <Text variant="headlineMedium" style={{ color: colors.secondary, fontWeight: 'bold', textAlign: 'center' }}>
                    ${state.currentItem.pawnValue}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                    Pawn Value
                  </Text>
                  <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs }}>
                    (30% of market value)
                  </Text>
                </View>
              </View>
              
              {state.currentItem.confidence && (
                <View style={styles.confidenceRow}>
                  <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                    Confidence: {Math.round(state.currentItem.confidence * 100)}%
                  </Text>
                </View>
              )}
              
              {state.currentItem.calculationMethod && (
                <View style={styles.methodRow}>
                  <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                    {state.currentItem.calculationMethod}
                  </Text>
                </View>
              )}
            </Surface>
          </View>
        )}

        {/* Item Details Form */}
        <View style={styles.formSection}>
          <Surface style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleLarge" style={[styles.formTitle, { color: colors.onSurface }]}>
              Item Details
            </Text>

            {/* Item Name */}
            <View style={styles.inputGroup}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: spacing.xs }}>
                Item Name *
              </Text>
              <TextInput
                mode="outlined"
                value={itemName}
                onChangeText={setItemName}
                placeholder="Enter item name"
                style={styles.textInput}
              />
            </View>

            {/* Brand and Model */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: spacing.xs }}>
                  Brand
                </Text>
                <TextInput
                  mode="outlined"
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Brand name"
                  style={styles.textInput}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: spacing.xs }}>
                  Model
                </Text>
                <TextInput
                  mode="outlined"
                  value={model}
                  onChangeText={setModel}
                  placeholder="Model number"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: spacing.xs }}>
                Category
              </Text>
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    selected={category === cat}
                    onPress={() => setCategory(cat)}
                    style={styles.categoryChip}
                    mode="outlined"
                  >
                    {cat}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Condition */}
            <View style={styles.inputGroup}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: spacing.xs }}>
                Condition
              </Text>
              <SegmentedButtons
                value={condition}
                onValueChange={setCondition}
                buttons={conditions}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: spacing.xs }}>
                Additional Notes
              </Text>
              <TextInput
                mode="outlined"
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional details about the item"
                multiline
                numberOfLines={3}
                style={styles.textInput}
              />
            </View>
          </Surface>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Button
            mode="outlined"
            onPress={handleBack}
            style={[styles.actionButton, { marginBottom: spacing.sm }]}
          >
            Back
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={styles.actionButton}
            loading={state.isLoading}
            disabled={!itemName.trim() || state.isLoading}
          >
            Confirm & Save
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  imageSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  imageContainer: {
    borderRadius: theme.roundness,
    overflow: 'hidden',
    ...shadows.medium,
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  pricingSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  pricingCard: {
    padding: spacing.lg,
    borderRadius: theme.roundness,
    ...shadows.medium,
  },
  pricingTitle: {
    marginBottom: spacing.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  pricingItem: {
    flex: 1,
    alignItems: 'center',
  },
  confidenceRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  methodRow: {
    alignItems: 'center',
  },
  formSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: theme.roundness,
    ...shadows.medium,
  },
  formTitle: {
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    marginBottom: spacing.xs,
  },
  segmentedButtons: {
    marginTop: spacing.xs,
  },
  actionsSection: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    width: '100%',
  },
});

export default ItemConfirmationScreen;
