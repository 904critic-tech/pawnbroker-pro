import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  useTheme,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const { login, register, state, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
  });

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!isLogin && (!formData.firstName || !formData.lastName)) {
      Alert.alert('Error', 'Please fill in your name');
      return;
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName || undefined,
        });
      }
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      elevation: 8,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 24,
    },
    input: {
      marginBottom: 16,
      backgroundColor: theme.colors.surfaceVariant,
    },
         button: {
       marginTop: 8,
       marginBottom: 16,
       borderRadius: 12,
       paddingVertical: 8,
     },
     demoButton: {
       marginTop: 8,
       marginBottom: 16,
       borderRadius: 12,
       paddingVertical: 8,
       borderColor: theme.colors.secondary,
     },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    toggleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
    },
    toggleText: {
      color: theme.colors.onSurfaceVariant,
      marginRight: 8,
    },
    toggleButton: {
      marginLeft: 4,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    loadingText: {
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 16,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>PawnBroker Pro</Text>
          <Text style={styles.subtitle}>
            Professional pawn valuation tool
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>

          {state.error && (
            <Text style={styles.errorText}>{state.error}</Text>
          )}

          {state.isLoading && (
            <Text style={styles.loadingText}>Please wait...</Text>
          )}

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) =>
                  setFormData({ ...formData, firstName: text })
                }
                mode="outlined"
                left={<TextInput.Icon icon="account" />}
              />
              <TextInput
                style={styles.input}
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) =>
                  setFormData({ ...formData, lastName: text })
                }
                mode="outlined"
                left={<TextInput.Icon icon="account" />}
              />
              <TextInput
                style={styles.input}
                label="Business Name (Optional)"
                value={formData.businessName}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessName: text })
                }
                mode="outlined"
                left={<TextInput.Icon icon="store" />}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            style={styles.input}
            label="Password"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            mode="outlined"
            secureTextEntry
            left={<TextInput.Icon icon="lock" />}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              mode="outlined"
              secureTextEntry
              left={<TextInput.Icon icon="lock-check" />}
            />
          )}

                     <Button
             mode="contained"
             onPress={handleSubmit}
             disabled={state.isLoading}
             style={styles.button}
             contentStyle={{ paddingVertical: 8 }}
             labelStyle={styles.buttonText}
           >
             {isLogin ? 'Sign In' : 'Create Account'}
           </Button>



           <Divider style={{ marginVertical: 16 }} />

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Button
              mode="text"
              onPress={() => {
                setIsLogin(!isLogin);
                clearError();
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  firstName: '',
                  lastName: '',
                  businessName: '',
                });
              }}
              style={styles.toggleButton}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
