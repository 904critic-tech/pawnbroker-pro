import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../theme/theme';

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors } = useTheme();

  const tabIcons = {
    Home: 'home',
    Camera: 'camera',
    Search: 'magnify',
    History: 'history',
    Settings: 'cog',
  };

  const tabLabels = {
    Home: 'Home',
    Camera: 'Camera',
    Search: 'Search',
    History: 'History',
    Settings: 'Settings',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = tabLabels[route.name as keyof typeof tabLabels] || route.name;
        const iconName = tabIcons[route.name as keyof typeof tabIcons] || 'circle';

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <View style={[
              styles.tabContent,
              isFocused && { backgroundColor: colors.primaryContainer }
            ]}>
              <View style={[
                styles.iconContainer,
                isFocused && { backgroundColor: colors.primary }
              ]}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={24}
                  color={isFocused ? colors.onPrimary : colors.onSurfaceVariant}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? colors.primary : colors.onSurfaceVariant }
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.large,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: theme.roundness,
    minWidth: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  icon: {
    fontSize: 20,
    fontFamily: 'MaterialCommunityIcons',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CustomTabBar;
