import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useApp } from '../context/AppContext';
import { theme, spacing } from '../theme/theme';

const LoadingOverlay: React.FC = () => {
  const { state } = useApp();
  const { colors } = useTheme();

  if (!state.isLoading) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={state.isLoading}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.spinner}
          />
          <Text variant="titleMedium" style={{ color: colors.onSurface, marginTop: spacing.md }}>
            Processing...
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs }}>
            Analyzing item and calculating market value
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: spacing.xl,
    borderRadius: theme.roundness,
    alignItems: 'center',
    minWidth: 200,
    ...theme.shadows?.large,
  },
  spinner: {
    marginBottom: spacing.sm,
  },
});

export default LoadingOverlay;
