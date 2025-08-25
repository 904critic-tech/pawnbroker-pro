import React, { Suspense, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import { theme } from './src/theme/theme';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatus from './src/components/NetworkStatus';
import { optimizeStartup, PerformanceMonitor } from './src/utils/performance';

// Lazy load screens for better performance
const HomeScreen = React.lazy(() => import('./src/screens/HomeScreen'));
const AuthScreen = React.lazy(() => import('./src/screens/AuthScreen'));
const SearchScreen = React.lazy(() => import('./src/screens/SearchScreen'));
const ResultsScreen = React.lazy(() => import('./src/screens/ResultsScreen'));
const HistoryScreen = React.lazy(() => import('./src/screens/HistoryScreen'));
const SettingsScreen = React.lazy(() => import('./src/screens/SettingsScreen'));
const ItemConfirmationScreen = React.lazy(() => import('./src/screens/ItemConfirmationScreen'));
const ProductSelectionScreen = React.lazy(() => import('./src/screens/ProductSelectionScreen'));
const BrandSelectionScreen = React.lazy(() => import('./src/screens/BrandSelectionScreen'));
const ModelSelectionScreen = React.lazy(() => import('./src/screens/ModelSelectionScreen'));
const ExactPricingScreen = React.lazy(() => import('./src/screens/ExactPricingScreen'));
const CameraScreen = React.lazy(() => import('./src/screens/CameraScreen'));

// Import components
import CustomTabBar from './src/components/CustomTabBar';
import LoadingScreen from './src/components/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  useEffect(() => {
    // Initialize performance optimizations
    PerformanceMonitor.startTimer('app-startup');
    optimizeStartup();
  }, []);

  return (
    <ErrorBoundary>
      <PaperProvider theme={theme as any}>
        <AppProvider>
          <NavigationContainer>
            <Suspense fallback={<LoadingScreen message="Initializing..." />}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="Results" component={ResultsScreen} />
                <Stack.Screen name="ItemConfirmation" component={ItemConfirmationScreen} />
                <Stack.Screen name="ProductSelection" component={ProductSelectionScreen} />
                <Stack.Screen name="BrandSelection" component={BrandSelectionScreen} />
                <Stack.Screen name="ModelSelection" component={ModelSelectionScreen} />
                <Stack.Screen name="ExactPricing" component={ExactPricingScreen} />
                <Stack.Screen name="Camera" component={CameraScreen} />
              </Stack.Navigator>
            </Suspense>
            <NetworkStatus showDetails={true} />
          </NavigationContainer>
        </AppProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
