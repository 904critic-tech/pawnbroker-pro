import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { marketplaceService, MarketData, ComprehensiveMarketData } from '../services/MarketplaceService';
import { theme } from '../theme/theme';

export default function MarketplaceTestScreen() {
  const [query, setQuery] = useState('iPhone 14 Pro');
  const [loading, setLoading] = useState(false);
  const [quickData, setQuickData] = useState<MarketData | null>(null);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveMarketData | null>(null);

  const testQuickEstimate = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const data = await marketplaceService.getQuickMarketEstimate(query);
      setQuickData(data);
      Alert.alert('Success', 'Quick estimate retrieved successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to get quick estimate: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testComprehensiveData = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const data = await marketplaceService.getComprehensiveMarketData(query);
      setComprehensiveData(data);
      Alert.alert('Success', 'Comprehensive data retrieved successfully!');
    } catch (error) {
      Alert.alert('Error', `Failed to get comprehensive data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const renderQuickData = () => {
    if (!quickData) return null;

    const formatted = marketplaceService.formatMarketData(quickData);

    return (
      <View style={styles.dataContainer}>
        <Text style={styles.sectionTitle}>Quick Estimate Results</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Market Value:</Text>
          <Text style={styles.value}>{formatted.marketValue}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Pawn Value:</Text>
          <Text style={styles.value}>{formatted.pawnValue}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Confidence:</Text>
          <Text style={styles.value}>{formatted.confidence}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Source:</Text>
          <Text style={styles.value}>{formatted.source}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Note:</Text>
          <Text style={styles.value}>{formatted.note}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Updated:</Text>
          <Text style={styles.value}>{formatted.lastUpdated}</Text>
        </View>
      </View>
    );
  };

  const renderComprehensiveData = () => {
    if (!comprehensiveData) return null;

    const formatted = marketplaceService.formatComprehensiveData(comprehensiveData);

    return (
      <View style={styles.dataContainer}>
        <Text style={styles.sectionTitle}>Comprehensive Data Results</Text>
        
        <Text style={styles.subsectionTitle}>Primary Source (eBay)</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Market Value:</Text>
          <Text style={styles.value}>{formatted.primary.marketValue}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Pawn Value:</Text>
          <Text style={styles.value}>{formatted.primary.pawnValue}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Confidence:</Text>
          <Text style={styles.value}>{formatted.primary.confidence}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Data Points:</Text>
          <Text style={styles.value}>{formatted.primary.dataPoints}</Text>
        </View>

        <Text style={styles.subsectionTitle}>Aggregated Data</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Market Value:</Text>
          <Text style={styles.value}>{formatted.aggregated.marketValue}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Pawn Value:</Text>
          <Text style={styles.value}>{formatted.aggregated.pawnValue}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Confidence:</Text>
          <Text style={styles.value}>{formatted.aggregated.confidence}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Sources Used:</Text>
          <Text style={styles.value}>{formatted.aggregated.sourcesUsed}</Text>
        </View>

        <Text style={styles.subsectionTitle}>Summary</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Primary Source:</Text>
          <Text style={styles.value}>{formatted.summary.primarySource}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Total Sources:</Text>
          <Text style={styles.value}>{formatted.summary.totalSources}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Recommendation:</Text>
          <Text style={styles.value}>{formatted.summary.recommendation}</Text>
        </View>

        {formatted.possibleMarketRates.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Possible Market Rates</Text>
            {formatted.possibleMarketRates.map((rate, index) => (
              <View key={index} style={styles.rateContainer}>
                <Text style={styles.rateSource}>{rate.source}</Text>
                <View style={styles.dataRow}>
                  <Text style={styles.label}>Market Value:</Text>
                  <Text style={styles.value}>{rate.marketValue}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.label}>Confidence:</Text>
                  <Text style={styles.value}>{rate.confidence}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Marketplace API Test</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Search Query:</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Enter item name (e.g., iPhone 14 Pro)"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testQuickEstimate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonText}>Test Quick Estimate</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testComprehensiveData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonText}>Test Comprehensive Data</Text>
          )}
        </TouchableOpacity>
      </View>

      {renderQuickData()}
      {renderComprehensiveData()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dataContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  rateContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    padding: 8,
    marginVertical: 4,
  },
  rateSource: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
});
