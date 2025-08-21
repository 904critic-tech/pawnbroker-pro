import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  ProgressBar,
  Chip,
  useTheme,
  IconButton,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme, spacing, shadows } from '../theme/theme';
import ImageDatasetScraper from '../services/ImageDatasetScraper';

interface ScrapingProgress {
  category: string;
  current: number;
  total: number;
  status: 'idle' | 'scraping' | 'completed' | 'error';
  error?: string;
}

const ImageDatasetScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const scraper = ImageDatasetScraper.getInstance();
  
  const [scrapingProgress, setScrapingProgress] = useState<{ [category: string]: ScrapingProgress }>({});
  const [stats, setStats] = useState(scraper.getStats());
  const [isScraping, setIsScraping] = useState(false);

  const categories = [
    'Smartphones',
    'Laptops', 
    'Tablets',
    'Watches',
    'Cameras'
  ];

  useEffect(() => {
    // Initialize progress for all categories
    const initialProgress: { [category: string]: ScrapingProgress } = {};
    categories.forEach(category => {
      initialProgress[category] = {
        category,
        current: 0,
        total: scraper.getSearchTermsForCategory(category).length,
        status: 'idle'
      };
    });
    setScrapingProgress(initialProgress);
  }, []);

  const startScrapingCategory = async (category: string) => {
    if (isScraping) {
      Alert.alert('Scraping in Progress', 'Please wait for the current scraping to complete.');
      return;
    }

    setIsScraping(true);
    setScrapingProgress(prev => ({
      ...prev,
      [category]: { ...prev[category], status: 'scraping', current: 0 }
    }));

    try {
      const searchTerms = scraper.getSearchTermsForCategory(category);
      console.log(`🔍 Starting to scrape ${category} with ${searchTerms.length} search terms`);

      const images = await scraper.scrapeCategory(category, searchTerms);
      
      setScrapingProgress(prev => ({
        ...prev,
        [category]: { 
          ...prev[category], 
          status: 'completed', 
          current: searchTerms.length 
        }
      }));

      setStats(scraper.getStats());
      
      Alert.alert(
        'Scraping Complete', 
        `Successfully scraped ${images.length} images for ${category}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('❌ Scraping failed:', error);
      setScrapingProgress(prev => ({
        ...prev,
        [category]: { 
          ...prev[category], 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      
      Alert.alert('Scraping Failed', 'Failed to scrape images. Please try again.');
    } finally {
      setIsScraping(false);
    }
  };

  const startScrapingAll = async () => {
    if (isScraping) {
      Alert.alert('Scraping in Progress', 'Please wait for the current scraping to complete.');
      return;
    }

    Alert.alert(
      'Start Scraping All Categories',
      'This will scrape images for all categories. This may take a while and use significant data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: async () => {
            setIsScraping(true);
            
            for (const category of categories) {
              if (!isScraping) break; // Check if user cancelled
              
              setScrapingProgress(prev => ({
                ...prev,
                [category]: { ...prev[category], status: 'scraping', current: 0 }
              }));

              try {
                const searchTerms = scraper.getSearchTermsForCategory(category);
                await scraper.scrapeCategory(category, searchTerms);
                
                setScrapingProgress(prev => ({
                  ...prev,
                  [category]: { 
                    ...prev[category], 
                    status: 'completed', 
                    current: searchTerms.length 
                  }
                }));

                setStats(scraper.getStats());
                
                // Rate limiting between categories
                await new Promise(resolve => setTimeout(resolve, 5000));
                
              } catch (error) {
                console.error(`❌ Failed to scrape ${category}:`, error);
                setScrapingProgress(prev => ({
                  ...prev,
                  [category]: { 
                    ...prev[category], 
                    status: 'error', 
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                }));
              }
            }
            
            setIsScraping(false);
            Alert.alert('Scraping Complete', 'Finished scraping all categories.');
          }
        }
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all scraped images and statistics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            scraper.clearData();
            setStats(scraper.getStats());
            
            // Reset progress
            const resetProgress: { [category: string]: ScrapingProgress } = {};
            categories.forEach(category => {
              resetProgress[category] = {
                category,
                current: 0,
                total: scraper.getSearchTermsForCategory(category).length,
                status: 'idle'
              };
            });
            setScrapingProgress(resetProgress);
            
            Alert.alert('Data Cleared', 'All scraped data has been cleared.');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.primary;
      case 'scraping': return colors.secondary;
      case 'error': return colors.error;
      default: return colors.outline;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'scraping': return 'loading';
      case 'error': return 'alert-circle';
      default: return 'circle-outline';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={colors.onSurface}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={{ color: colors.onSurface }}>
          Image Dataset
        </Text>
        <IconButton
          icon="trash-can"
          size={24}
          iconColor={colors.error}
          onPress={clearAllData}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Card */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.md }}>
              📊 Dataset Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: colors.primary }}>
                  {stats.totalImages}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Total Images
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: colors.secondary }}>
                  {Object.keys(stats.categories).length}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Categories
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={{ color: colors.tertiary }}>
                  {Object.keys(stats.brands).length}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Brands
                </Text>
              </View>
            </View>

            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing.md }}>
              Last Updated: {new Date(stats.lastUpdated).toLocaleString()}
            </Text>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={startScrapingAll}
            disabled={isScraping}
            style={[styles.button, { backgroundColor: colors.primary }]}
            icon={isScraping ? 'loading' : 'download'}
          >
            {isScraping ? 'Scraping...' : 'Scrape All Categories'}
          </Button>
        </View>

        {/* Categories */}
        <Text variant="titleMedium" style={{ color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.md }}>
          📁 Categories
        </Text>

        {categories.map(category => {
          const progress = scrapingProgress[category];
          const searchTerms = scraper.getSearchTermsForCategory(category);
          
          return (
            <Card key={category} style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Text variant="titleMedium" style={{ color: colors.onSurface }}>
                      {category}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                      {searchTerms.length} search terms
                    </Text>
                  </View>
                  
                  <IconButton
                    icon={getStatusIcon(progress?.status || 'idle')}
                    size={24}
                    iconColor={getStatusColor(progress?.status || 'idle')}
                    style={progress?.status === 'scraping' ? styles.spinning : undefined}
                  />
                </View>

                {progress && (
                  <View style={styles.progressContainer}>
                    <ProgressBar
                      progress={progress.total > 0 ? progress.current / progress.total : 0}
                      color={getStatusColor(progress.status)}
                      style={styles.progressBar}
                    />
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: spacing.xs }}>
                      {progress.current} / {progress.total} completed
                    </Text>
                  </View>
                )}

                {progress?.error && (
                  <Text variant="bodySmall" style={{ color: colors.error, marginTop: spacing.xs }}>
                    Error: {progress.error}
                  </Text>
                )}

                <View style={styles.categoryActions}>
                  <Button
                    mode="outlined"
                    onPress={() => startScrapingCategory(category)}
                    disabled={isScraping}
                    style={styles.categoryButton}
                    compact
                  >
                    Scrape {category}
                  </Button>
                  
                  <Chip
                    mode="outlined"
                    style={styles.statsChip}
                  >
                    {stats.categories[category] || 0} images
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          );
        })}

        {/* Brand Statistics */}
        {Object.keys(stats.brands).length > 0 && (
          <>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.md }}>
              🏷️ Brands
            </Text>
            
            <View style={styles.brandsContainer}>
              {Object.entries(stats.brands).map(([brand, count]) => (
                <Chip key={brand} mode="outlined" style={styles.brandChip}>
                  {brand}: {count}
                </Chip>
              ))}
            </View>
          </>
        )}

        {/* Instructions */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.md }}>
              ℹ️ Instructions
            </Text>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              • This tool scrapes real product images from eBay for training the image recognition model{'\n'}
              • Images are collected with their associated brand, model, and condition data{'\n'}
              • Scraping respects rate limits to avoid overwhelming eBay's servers{'\n'}
              • All data is stored locally and used only for improving recognition accuracy{'\n'}
              • No mock or simulated data is used - only real product images
            </Text>
          </Card.Content>
        </Card>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  actionButtons: {
    marginBottom: spacing.lg,
  },
  button: {
    marginBottom: spacing.sm,
  },
  categoryCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  categoryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  categoryButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  statsChip: {
    minWidth: 80,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandChip: {
    marginBottom: spacing.xs,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
});

export default ImageDatasetScreen;
