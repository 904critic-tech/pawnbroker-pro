import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  IconButton,
  Chip,
  Divider,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme, spacing, shadows, borderRadius } from '../theme/theme';
import { safeFormatNumber, aiErrorReporter } from '../services/AIErrorReporter';

const { width } = Dimensions.get('window');

const ResultsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  
  // Get item data from navigation params
  const item = (route.params as any)?.item;
  
  // If no item data, show error or redirect
  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => navigation.goBack()}
            iconColor={colors.onSurface}
          />
          <Text variant="headlineMedium" style={{ color: colors.onSurface, flex: 1, fontWeight: '600' }}>
            Valuation Results
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text variant="titleLarge" style={{ color: colors.onSurface, textAlign: 'center', marginBottom: 16 }}>
            No Item Data
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
            Please go back and try again with a valid item.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const [selectedAction, setSelectedAction] = useState<'accept' | 'adjust' | 'new'>('accept');

  const handleAction = (action: 'accept' | 'adjust' | 'new') => {
    setSelectedAction(action);
    if (action === 'accept') {
      // Handle accept offer
      
    } else if (action === 'adjust') {
      // Handle adjust offer
      
    } else if (action === 'new') {
      // Handle new estimate
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Header */}
        <View style={styles.header}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => navigation.goBack()}
            iconColor={colors.onSurface}
          />
          <Text variant="headlineMedium" style={{ color: colors.onSurface, flex: 1, fontWeight: '600' }}>
            Valuation Results
          </Text>
          <IconButton 
            icon="share" 
            size={24} 
            onPress={() => {}}
            iconColor={colors.onSurface}
          />
        </View>

        {/* Premium Market Value Display */}
        <View style={styles.section}>
          <Surface style={[styles.premiumValueCard, { backgroundColor: colors.primary }]}>
            <View style={styles.premiumValueHeader}>
              <Text variant="titleMedium" style={{ color: colors.onPrimary, textAlign: 'center', opacity: 0.9 }}>
                ESTIMATED MARKET VALUE
              </Text>
              <Text variant="displayLarge" style={{ color: colors.onPrimary, textAlign: 'center', fontWeight: '700' }}>
                ${safeFormatNumber(item.marketValue)}
              </Text>
              <View style={styles.premiumConfidenceBadge}>
                <Text variant="labelMedium" style={{ color: colors.onPrimary, fontWeight: '600' }}>
                  {Math.round(item.confidence * 100)}% Confidence
                </Text>
              </View>
            </View>
          </Surface>
        </View>

        {/* Premium Offer Display */}
        <View style={styles.section}>
          <Surface style={[styles.premiumOfferCard, { backgroundColor: colors.secondary }]}>
            <View style={styles.premiumOfferHeader}>
              <Text variant="headlineSmall" style={{ color: colors.onSecondary, textAlign: 'center', fontWeight: '700' }}>
                YOUR OFFER
              </Text>
              <Text variant="displayMedium" style={{ color: colors.onSecondary, textAlign: 'center', fontWeight: '700' }}>
                ${safeFormatNumber(item.pawnValue)}
              </Text>

            </View>
          </Surface>
        </View>

        {/* Premium Item Details */}
        <View style={styles.section}>
          <Surface style={[styles.premiumDetailsCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: spacing.lg, fontWeight: '600' }}>
              Item Details
            </Text>
            
            <View style={styles.premiumDetailRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Item Name</Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>{item.name}</Text>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            
            <View style={styles.premiumDetailRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Brand</Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>{item.brand}</Text>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            
            <View style={styles.premiumDetailRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Model</Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>{item.model}</Text>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            
            {/* AI Learning Indicator */}
            {item.aiLearningData && (
              <View style={styles.aiLearningIndicator}>
                <Chip mode="outlined" style={styles.aiChip}>
                  <IconButton icon="brain" size={16} iconColor={colors.primary} />
                  <Text variant="bodySmall" style={{ color: colors.primary }}>
                    AI Learning: Brand/Model detection improving
                  </Text>
                </Chip>
              </View>
            )}
            <Divider style={{ marginVertical: spacing.sm }} />
            
            <View style={styles.premiumDetailRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Category</Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>{item.category}</Text>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            
            <View style={styles.premiumDetailRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Condition</Text>
              <Chip 
                mode="outlined" 
                textStyle={{ color: (colors as any).success }}
                style={{ borderColor: (colors as any).success }}
              >
                {item.condition}
              </Chip>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            
            <View style={styles.premiumDetailRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Potential Profit</Text>
              <Text variant="titleMedium" style={{ color: (colors as any).profit, fontWeight: '700' }}>
                ${safeFormatNumber((item.marketValue || 0) - (item.pawnValue || 0))}
              </Text>
            </View>
          </Surface>
        </View>

                 {/* AI Search Results */}
         <View style={styles.section}>
           <Surface style={[styles.premiumAnalysisCard, { backgroundColor: colors.surface }]}>
                           <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: spacing.lg, fontWeight: '600' }}>
                How We Calculated This Value
              </Text>
             
                             <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginBottom: spacing.md }}>
                  Based on {item.searchResults?.length || 0} recent eBay sales and market data:
                </Text>
                

             
                             {/* Show actual search results with images if available */}
                {item.searchResults && item.searchResults.length > 0 ? (
                  <View style={styles.searchResultsContainer}>
                    {item.searchResults.slice(0, 5).map((result: any, index: number) => (
                      <View key={index} style={styles.searchResultItem}>
                        <View style={styles.searchResultHeader}>
                                                     {/* Show item image if available */}
                           {result.imageUrl && (
                             <Image 
                               source={{ uri: result.imageUrl }} 
                               style={styles.searchResultImage}
                               resizeMode="cover"
                             />
                           )}
                          <View style={styles.searchResultContent}>
                            <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600', flex: 1 }}>
                              {result.title || result.name}
                            </Text>
                            <Text variant="titleMedium" style={{ color: (colors as any).success, fontWeight: '700' }}>
                              ${safeFormatNumber(result.price || result.marketValue)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.searchResultDetails}>
                          {result.condition && (
                            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                              Condition: {result.condition}
                            </Text>
                          )}
                          {result.soldDate && (
                            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                              Sold: {new Date(result.soldDate).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                    {item.searchResults.length > 5 && (
                      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }}>
                        +{item.searchResults.length - 5} more results analyzed
                      </Text>
                    )}
                  </View>
                ) : (
               <View style={styles.noResultsContainer}>
                 <IconButton icon="database-search" size={48} iconColor={colors.onSurfaceVariant} />
                 <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                   AI analyzed market trends and pricing data from multiple sources
                 </Text>
               </View>
             )}
           </Surface>
         </View>

         {/* Premium Market Analysis */}
         <View style={styles.section}>
           <Surface style={[styles.premiumAnalysisCard, { backgroundColor: colors.surface }]}>
             <Text variant="titleLarge" style={{ color: colors.onSurface, marginBottom: spacing.lg, fontWeight: '600' }}>
               Market Analysis
             </Text>
             
             <View style={styles.analysisGrid}>
               <View style={styles.analysisItem}>
                 <Text variant="headlineSmall" style={{ color: (colors as any).info, fontWeight: '700' }}>
                   ${safeFormatNumber(Math.round((item.marketValue || 0) * 0.8))}
                 </Text>
                 <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                   Low Range
                 </Text>
               </View>
               <View style={styles.analysisItem}>
                 <Text variant="headlineSmall" style={{ color: (colors as any).marketValue, fontWeight: '700' }}>
                   ${safeFormatNumber(item.marketValue)}
                 </Text>
                 <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                   Average
                 </Text>
               </View>
               <View style={styles.analysisItem}>
                 <Text variant="headlineSmall" style={{ color: (colors as any).success, fontWeight: '700' }}>
                   ${safeFormatNumber(Math.round((item.marketValue || 0) * 1.2))}
                 </Text>
                 <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                   High Range
                 </Text>
               </View>
             </View>
           </Surface>
         </View>

        {/* Premium Action Buttons */}
        <View style={styles.section}>
          <View style={styles.premiumActionButtons}>
            <TouchableOpacity 
              style={[
                styles.premiumActionButton, 
                { 
                  backgroundColor: selectedAction === 'accept' ? (colors as any).success : colors.surfaceVariant,
                  borderWidth: selectedAction === 'accept' ? 0 : 1,
                  borderColor: colors.outline,
                }
              ]}
              onPress={() => handleAction('accept')}
            >
              <Text style={{ 
                color: selectedAction === 'accept' ? (colors as any).onSuccess : colors.onSurface, 
                textAlign: 'center', 
                fontWeight: '700', 
                fontSize: 16 
              }}>
                Accept Offer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.premiumActionButton, 
                { 
                  backgroundColor: selectedAction === 'adjust' ? (colors as any).warning : colors.surfaceVariant,
                  borderWidth: selectedAction === 'adjust' ? 0 : 1,
                  borderColor: colors.outline,
                }
              ]}
              onPress={() => handleAction('adjust')}
            >
              <Text style={{ 
                color: selectedAction === 'adjust' ? (colors as any).onWarning : colors.onSurface, 
                textAlign: 'center', 
                fontWeight: '600', 
                fontSize: 16 
              }}>
                Adjust Offer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.premiumActionButton, 
                { 
                  backgroundColor: 'transparent', 
                  borderWidth: 1, 
                  borderColor: colors.outline 
                }
              ]}
              onPress={() => handleAction('new')}
            >
              <Text style={{ 
                color: colors.onSurface, 
                textAlign: 'center', 
                fontWeight: '600', 
                fontSize: 16 
              }}>
                New Estimate
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Premium Notes Section */}
        {item.notes && (
          <View style={styles.section}>
            <Surface style={[styles.premiumNotesCard, { backgroundColor: colors.surface }]}>
              <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.md, fontWeight: '600' }}>
                Notes
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, lineHeight: 24 }}>
                {item.notes}
              </Text>
            </Surface>
          </View>
        )}
      </ScrollView>
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
  section: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  
  // Premium Value Display
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
  
  // Premium Offer Display
  premiumOfferCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.large,
  },
  premiumOfferHeader: {
    alignItems: 'center',
  },
  
  // Premium Details
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
  
  // Premium Analysis
  premiumAnalysisCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  analysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  analysisItem: {
    alignItems: 'center',
  },
  
  // Premium Actions
  premiumActionButtons: {
    gap: spacing.md,
  },
  premiumActionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.small,
  },
  
  // Premium Notes
  premiumNotesCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  
  // AI Learning Indicator
  aiLearningIndicator: {
    marginTop: spacing.md,
  },
  aiChip: {
    alignSelf: 'flex-start',
  },
  
  // Search Results
  searchResultsContainer: {
    gap: spacing.md,
  },
  searchResultItem: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  searchResultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultDetails: {
    marginTop: spacing.xs,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
});

export default ResultsScreen;
