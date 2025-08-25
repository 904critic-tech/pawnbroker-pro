import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Switch,
  Surface,
  useTheme,
  IconButton,
  List,
  Divider,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { theme, spacing, shadows } from '../theme/theme';
import LearningService from '../services/LearningService';
import IntegrityStatusComponent from '../components/IntegrityStatusComponent';

const SettingsScreen: React.FC = () => {
  const { state, updateSettings, dispatch } = useApp();
  const { colors } = useTheme();
  const navigation = useNavigation();
  
  const [pawnPercentage, setPawnPercentage] = useState(state.settings.pawnPercentage);
  const [enableNotifications, setEnableNotifications] = useState(state.settings.notifications);
  const [autoSave, setAutoSave] = useState(state.settings.autoSave);

  const handleSaveSettings = () => {
    updateSettings({
      pawnPercentage,
      notifications: enableNotifications,
      autoSave,
    });
    Alert.alert('Settings Saved', 'Your settings have been updated successfully.');
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            updateSettings({
              pawnPercentage: 30,
              notifications: true,
              autoSave: true,
            });
            setPawnPercentage(30);
            setEnableNotifications(true);
            setAutoSave(true);
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      // Export real data from app state
      const exportData = {
        history: state.searchHistory || [],
        settings: state.settings || {},
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // In a real app, you would save this to a file or share it
      // For now, we'll just show an alert with the data
      Alert.alert(
        'Data Export',
        `Exported ${exportData.history.length} items from history.\n\nData preview:\n${jsonData.substring(0, 200)}...`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your pricing history and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all data from app state
              dispatch({ type: 'ADD_TO_HISTORY', payload: [] });
              
              // Clear learning data
              const learningService = LearningService.getInstance();
              await learningService.clearAllLearningData();
              
              Alert.alert('Data Cleared', 'All data has been cleared successfully.');
            } catch (error) {
              console.error('Clear data failed:', error);
              Alert.alert('Clear Failed', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ color: colors.onBackground }}>
            Settings
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            Customize your pawnbroker app experience
          </Text>
        </View>

        {/* Pricing Settings */}
        <View style={styles.section}>
          <Surface style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.lg }}>
              Pricing Settings
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                  Pawn Percentage
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {pawnPercentage}% of market value
                </Text>
              </View>
              <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: '600' }}>
                {pawnPercentage}%
              </Text>
            </View>
            
            <View style={styles.percentageButtons}>
              {[10, 15, 20, 25, 30, 35, 40, 45, 50].map((value) => (
                <Button
                  key={value}
                  mode={pawnPercentage === value ? 'contained' : 'outlined'}
                  onPress={() => setPawnPercentage(value)}
                  style={styles.percentageButton}
                  labelStyle={{ fontSize: 12 }}
                >
                  {value}%
                </Button>
              ))}
            </View>
          </Surface>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Surface style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.lg }}>
              App Preferences
            </Text>
            
            <List.Item
              title="Enable Notifications"
              description="Receive alerts for new features and updates"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={enableNotifications}
                  onValueChange={setEnableNotifications}
                  trackColor={{ false: colors.outline, true: colors.primary }}
                  thumbColor={enableNotifications ? colors.onPrimary : colors.onSurface}
                />
              )}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Auto Save"
              description="Automatically save estimates to history"
              left={(props) => <List.Icon {...props} icon="content-save" />}
              right={() => (
                <Switch
                  value={autoSave}
                  onValueChange={setAutoSave}
                  trackColor={{ false: colors.outline, true: colors.primary }}
                  thumbColor={autoSave ? colors.onPrimary : colors.onSurface}
                />
              )}
              style={styles.listItem}
            />
          </Surface>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Surface style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.lg }}>
              Data Management
            </Text>
            
            <List.Item
              title="Export Data"
              description="Download your pricing history"
              left={(props) => <List.Icon {...props} icon="download" />}
              onPress={handleExportData}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Clear All Data"
              description="Permanently delete all data"
              left={(props) => <List.Icon {...props} icon="delete" color={colors.error} />}
              onPress={handleClearAllData}
              style={styles.listItem}
              titleStyle={{ color: colors.error }}
            />
          </Surface>
        </View>

        {/* App Integrity Status */}
        <View style={styles.section}>
          <IntegrityStatusComponent 
            showDetails={true}
            onStatusChange={(isTrusted) => {
              if (!isTrusted) {
                Alert.alert(
                  'Security Warning',
                  'App integrity check failed. Please ensure you downloaded this app from the official Google Play Store.',
                  [{ text: 'OK' }]
                );
              }
            }}
          />
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Surface style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.lg }}>
              App Information
            </Text>
            
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Terms of Service"
              description="Read our terms and conditions"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              onPress={() => Alert.alert('Terms of Service', 'Terms of service coming soon!')}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Privacy Policy"
              description="Learn about data privacy"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              onPress={() => Alert.alert('Privacy Policy', 'Privacy policy coming soon!')}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Support"
              description="Get help and contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              onPress={() => Alert.alert('Support', 'Support contact coming soon!')}
              style={styles.listItem}
            />
          </Surface>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Surface style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
            <Text variant="titleMedium" style={{ color: colors.onSurface, marginBottom: spacing.lg }}>
              Account
            </Text>
            
            <List.Item
              title="Upgrade to Pro"
              description="Get unlimited queries and no ads"
              left={(props) => <List.Icon {...props} icon="star" color={colors.primary} />}
              onPress={() => {
                Alert.alert(
                  'Upgrade to Pro',
                  'Get unlimited daily queries, no ads, and premium features for $9.99/month',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Upgrade',
                      onPress: () => {},
                    },
                  ]
                );
              }}
              style={styles.listItem}
              titleStyle={{ color: colors.error }}
            />
          </Surface>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Button
            mode="contained"
            onPress={handleSaveSettings}
            style={styles.actionButton}
          >
            Save Settings
          </Button>
          <Button
            mode="outlined"
            onPress={handleResetSettings}
            style={styles.actionButton}
          >
            Reset to Default
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
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  settingsCard: {
    padding: spacing.lg,
    borderRadius: theme.roundness,
    ...shadows.medium,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  slider: {
    marginVertical: spacing.md,
  },
  percentageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  percentageButton: {
    marginBottom: spacing.xs,
    minWidth: 60,
  },
  listItem: {
    paddingVertical: spacing.xs,
  },
  actionsSection: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
});

export default SettingsScreen;
