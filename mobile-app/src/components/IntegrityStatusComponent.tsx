import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Card, Chip, Divider } from 'react-native-paper';
import PlayIntegrityService, {
  IntegrityCheckResult,
  PlayIntegrityConfig,
} from '../services/PlayIntegrityService';
import { ENVIRONMENT } from '../config/environment';

interface IntegrityStatusComponentProps {
  showDetails?: boolean;
  onStatusChange?: (isTrusted: boolean) => void;
}

const IntegrityStatusComponent: React.FC<IntegrityStatusComponentProps> = ({
  showDetails = false,
  onStatusChange,
}) => {
  const [integrityResult, setIntegrityResult] = useState<IntegrityCheckResult | null>(null);
  const [config, setConfig] = useState<PlayIntegrityConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const integrityService = PlayIntegrityService.getInstance();

  useEffect(() => {
    initializeIntegrity();
  }, []);

  const initializeIntegrity = async () => {
    try {
      await integrityService.initialize();
      setConfig(integrityService.getConfiguration());
      await performIntegrityCheck();
    } catch (error) {
      console.error('Failed to initialize integrity service:', error);
    }
  };

  const performIntegrityCheck = async () => {
    setIsLoading(true);
    try {
      const result = await integrityService.performIntegrityCheck();
      setIntegrityResult(result);
      setLastCheck(Date.now());
      
      if (onStatusChange) {
        onStatusChange(result.isTrusted);
      }
    } catch (error) {
      console.error('Integrity check failed:', error);
      Alert.alert('Integrity Check Failed', 'Unable to verify app integrity');
    } finally {
      setIsLoading(false);
    }
  };

  const forceIntegrityCheck = async () => {
    setIsLoading(true);
    try {
      const result = await integrityService.forceIntegrityCheck();
      setIntegrityResult(result);
      setLastCheck(Date.now());
      
      if (onStatusChange) {
        onStatusChange(result.isTrusted);
      }
    } catch (error) {
      console.error('Forced integrity check failed:', error);
      Alert.alert('Integrity Check Failed', 'Unable to verify app integrity');
    } finally {
      setIsLoading(false);
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return '#10b981'; // Green
      case 'MEDIUM':
        return '#f59e0b'; // Amber
      case 'LOW':
        return '#ef4444'; // Red
      case 'UNTRUSTED':
        return '#dc2626'; // Dark red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'HIGH':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🔴';
      case 'UNTRUSTED':
        return '⛔';
      default:
        return '⚪';
    }
  };

  const formatLastCheck = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  if (!config) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.loadingText}>Initializing integrity service...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>App Integrity Status</Text>
            <TouchableOpacity
              style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}
              onPress={forceIntegrityCheck}
              disabled={isLoading}
            >
              <Text style={styles.refreshButtonText}>
                {isLoading ? 'Checking...' : '🔄'}
              </Text>
            </TouchableOpacity>
          </View>

          {integrityResult && (
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={styles.statusValue}>
                  <Text style={styles.statusIcon}>
                    {integrityResult.isTrusted ? '✅' : '❌'}
                  </Text>
                  <Text style={[
                    styles.statusText,
                    { color: integrityResult.isTrusted ? '#10b981' : '#ef4444' }
                  ]}>
                    {integrityResult.isTrusted ? 'Trusted' : 'Untrusted'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Security Level:</Text>
                <View style={styles.statusValue}>
                  <Text style={styles.statusIcon}>
                    {getSecurityLevelIcon(integrityResult.securityLevel)}
                  </Text>
                  <Text style={[
                    styles.statusText,
                    { color: getSecurityLevelColor(integrityResult.securityLevel) }
                  ]}>
                    {integrityResult.securityLevel}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Check:</Text>
                <Text style={styles.statusText}>
                  {formatLastCheck(lastCheck)}
                </Text>
              </View>
            </View>
          )}

          {showDetails && integrityResult && (
            <>
              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {integrityResult.recommendations.length > 0 ? (
                integrityResult.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Text style={styles.recommendationText}>• {recommendation}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noRecommendations}>No issues detected</Text>
              )}

              <Divider style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Configuration</Text>
              <View style={styles.configContainer}>
                {Object.entries(config).map(([key, value]) => (
                  <View key={key} style={styles.configItem}>
                    <Text style={styles.configLabel}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </Text>
                    <View style={styles.configValue}>
                      <Chip
                        mode="outlined"
                        style={[
                          styles.configChip,
                          { backgroundColor: value.enabled ? '#dcfce7' : '#fef2f2' }
                        ]}
                        textStyle={{
                          color: value.enabled ? '#166534' : '#dc2626'
                        }}
                      >
                        {value.enabled ? 'Enabled' : 'Disabled'}
                      </Chip>
                    </View>
                  </View>
                ))}
              </View>

              {integrityResult.response && (
                <>
                  <Divider style={styles.divider} />
                  
                  <Text style={styles.sectionTitle}>Response Details</Text>
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseText}>
                      Package: {integrityResult.response.requestDetails.packageName}
                    </Text>
                    <Text style={styles.responseText}>
                      App Verdict: {integrityResult.response.appIntegrity.appRecognitionVerdict}
                    </Text>
                    <Text style={styles.responseText}>
                      Device Verdict: {integrityResult.response.deviceIntegrity.deviceRecognitionVerdict.join(', ')}
                    </Text>
                    <Text style={styles.responseText}>
                      Licensing: {integrityResult.response.accountDetails.appLicensingVerdict}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2d3748',
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#a0aec0',
    fontWeight: '500',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#2d3748',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  noRecommendations: {
    fontSize: 14,
    color: '#10b981',
    fontStyle: 'italic',
  },
  configContainer: {
    marginBottom: 16,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configLabel: {
    fontSize: 14,
    color: '#a0aec0',
    flex: 1,
  },
  configValue: {
    flex: 1,
    alignItems: 'flex-end',
  },
  configChip: {
    borderColor: '#4a5568',
  },
  responseContainer: {
    backgroundColor: '#2d3748',
    padding: 12,
    borderRadius: 8,
  },
  responseText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  loadingText: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
  },
});

export default IntegrityStatusComponent;
