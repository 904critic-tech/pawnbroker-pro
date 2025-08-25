import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import offlineStorageService from '../services/OfflineStorageService';

interface NetworkStatusProps {
  showDetails?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ showDetails = false }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: 0,
    pendingOperations: 0,
    cachedItems: 0,
    isOnline: true,
  });
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    // Get initial network status
    const updateNetworkStatus = async () => {
      const status = await offlineStorageService.getSyncStatus();
      setIsOnline(status.isOnline);
      setSyncStatus(status);
    };

    updateNetworkStatus();

    // Listen for network changes
    const unsubscribe = offlineStorageService.addNetworkListener((online) => {
      setIsOnline(online);
      setSyncStatus(prev => ({ ...prev, isOnline: online }));
      
      // Animate status change
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Update sync status periodically
    const interval = setInterval(updateNetworkStatus, 10000); // Every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return '#ef4444'; // Red for offline
    if (syncStatus.pendingOperations > 0) return '#f59e0b'; // Amber for pending sync
    return '#10b981'; // Green for online and synced
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.pendingOperations > 0) return 'Syncing...';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'wifi-off';
    if (syncStatus.pendingOperations > 0) return 'sync';
    return 'wifi';
  };

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!showDetails && isOnline && syncStatus.pendingOperations === 0) {
    return null; // Don't show anything when everything is fine
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
        <View style={styles.statusContent}>
          <IconButton
            icon={getStatusIcon()}
            size={16}
            iconColor="white"
            style={styles.icon}
          />
          <Text style={styles.statusText}>{getStatusText()}</Text>
          
          {syncStatus.pendingOperations > 0 && (
            <Text style={styles.pendingText}>
              {syncStatus.pendingOperations} pending
            </Text>
          )}
          
          {showDetails && (
            <IconButton
              icon={showSyncDetails ? 'chevron-up' : 'chevron-down'}
              size={16}
              iconColor="white"
              onPress={() => setShowSyncDetails(!showSyncDetails)}
              style={styles.detailsButton}
            />
          )}
        </View>
      </View>

      {showDetails && showSyncDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Sync:</Text>
            <Text style={styles.detailValue}>
              {formatLastSync(syncStatus.lastSync)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending Operations:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.pendingOperations}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cached Items:</Text>
            <Text style={styles.detailValue}>
              {syncStatus.cachedItems}
            </Text>
          </View>
          
          {!isOnline && (
            <View style={styles.offlineMessage}>
              <Text style={styles.offlineText}>
                You're currently offline. Some features may be limited.
                Data will sync when connection is restored.
              </Text>
            </View>
          )}
          
          {syncStatus.pendingOperations > 0 && isOnline && (
            <View style={styles.syncMessage}>
              <Text style={styles.syncText}>
                Syncing {syncStatus.pendingOperations} operations...
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    margin: 0,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  pendingText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 8,
  },
  detailsButton: {
    margin: 0,
  },
  detailsContainer: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  detailValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  offlineMessage: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  syncMessage: {
    backgroundColor: '#d97706',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  syncText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default NetworkStatus;
