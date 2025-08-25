import { MD3DarkTheme } from 'react-native-paper';

// Custom dark theme with sophisticated color palette
export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary brand colors - deep blues and golds
    primary: '#1E3A8A', // Deep blue
    primaryContainer: '#1E40AF',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#E0E7FF',
    
    // Secondary colors - gold accents
    secondary: '#F59E0B', // Gold
    secondaryContainer: '#FCD34D',
    onSecondary: '#000000',
    onSecondaryContainer: '#92400E',
    
    // Tertiary colors - emerald accents
    tertiary: '#059669', // Emerald
    tertiaryContainer: '#34D399',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#064E3B',
    
    // Surface colors - sophisticated dark grays
    surface: '#1F2937', // Dark gray
    surfaceVariant: '#374151',
    onSurface: '#F9FAFB',
    onSurfaceVariant: '#D1D5DB',
    
    // Background colors
    background: '#111827', // Very dark gray
    onBackground: '#F9FAFB',
    
    // Error colors
    error: '#EF4444',
    errorContainer: '#7F1D1D',
    onError: '#FFFFFF',
    onErrorContainer: '#FEE2E2',
    
    // Success colors
    success: '#10B981',
    successContainer: '#064E3B',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#D1FAE5',
    
    // Warning colors
    warning: '#F59E0B',
    warningContainer: '#92400E',
    onWarning: '#FFFFFF',
    onWarningContainer: '#FEF3C7',
    
    // Info colors
    info: '#3B82F6',
    infoContainer: '#1E40AF',
    onInfo: '#FFFFFF',
    onInfoContainer: '#DBEAFE',
    
    // Custom business colors
    gold: '#F59E0B',
    silver: '#9CA3AF',
    bronze: '#CD7F32',
    
    // Market value colors
    marketValue: '#10B981', // Green for market value
    pawnValue: '#F59E0B', // Gold for pawn value
    profit: '#10B981', // Green for profit
    loss: '#EF4444', // Red for loss
    
    // Outline and borders
    outline: '#4B5563',
    outlineVariant: '#6B7280',
    
    // Shadow colors for dark theme
    shadow: '#000000',
    scrim: '#000000',
    
    // Gradient colors
    gradientStart: '#1E3A8A',
    gradientEnd: '#1E40AF',
    gradientGoldStart: '#F59E0B',
    gradientGoldEnd: '#FCD34D',
  },
  roundness: 12,
  isV3: true,
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Sophisticated shadow system for dark theme
export const shadows = {
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10.32,
    elevation: 16,
  },
  extraLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16.0,
    elevation: 24,
  },
};

// Typography scale
export const typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '700',
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '600',
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '600',
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
};

// Border radius system
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Z-index system
export const zIndex = {
  base: 0,
  card: 1,
  modal: 10,
  overlay: 100,
  tooltip: 1000,
};

export default theme;
