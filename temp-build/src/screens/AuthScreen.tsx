import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Surface,
  useTheme,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme, spacing, shadows } from '../theme/theme';
import SupabaseService, { AuthUser } from '../services/SupabaseService';

interface AuthScreenProps {
  route?: {
    params?: {
      mode?: 'login' | 'register';
    };
  };
}

const AuthScreen: React.FC<AuthScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [mode, setMode] = useState<'login' | 'register'>(route?.params?.mode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const supabaseService = SupabaseService.getInstance();

  useEffect(() => {
    // Check if user is already authenticated
    const user = supabaseService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Navigate to main app
      (navigation as any).navigate('Main');
    }

    // Listen for auth state changes
    const unsubscribe = supabaseService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        (navigation as any).navigate('Main');
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await supabaseService.signIn(email, password);

      } else {
        await supabaseService.signUp(email, password);
        
        Alert.alert(
          'Success',
          'Account created successfully! Please check your email for verification.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Auth error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    setLoading(true);

    try {
      await supabaseService.resetPassword(email);
      Alert.alert(
        'Password Reset',
        'Password reset email sent. Please check your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  if (currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={{ color: colors.onSurface, marginTop: spacing.md }}>
            Signing you in...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headlineLarge" style={{ color: colors.onBackground, textAlign: 'center' }}>
              PawnBroker Pro
            </Text>
            <Text variant="titleMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </Text>
          </View>

          {/* Auth Form */}
          <Surface style={[styles.authCard, { backgroundColor: colors.surface }]}>
            {mode === 'register' && (
              <TextInput
                label="Display Name (Optional)"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                autoCapitalize="words"
                disabled={loading}
              />
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              disabled={loading}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              autoComplete="password"
              disabled={loading}
            />

            {mode === 'register' && (
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                autoComplete="password"
                disabled={loading}
              />
            )}

            <Button
              mode="contained"
              onPress={handleAuth}
              style={styles.authButton}
              disabled={loading}
              loading={loading}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>

            {mode === 'login' && (
              <Button
                mode="text"
                onPress={handleForgotPassword}
                style={styles.forgotButton}
                disabled={loading}
              >
                Forgot Password?
              </Button>
            )}
          </Surface>

          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <Button
              mode="text"
              onPress={toggleMode}
              disabled={loading}
              compact
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </Button>
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  authCard: {
    padding: spacing.lg,
    borderRadius: theme.roundness,
    ...shadows.medium,
  },
  input: {
    marginBottom: spacing.md,
  },
  authButton: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  forgotButton: {
    marginTop: spacing.xs,
  },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});

export default AuthScreen;
