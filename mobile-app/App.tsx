import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { AppProvider } from './src/context/AppContext';
import { theme } from './src/theme/theme';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import SearchScreen from './src/screens/SearchScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ItemConfirmationScreen from './src/screens/ItemConfirmationScreen';
import MarketplaceTestScreen from './src/screens/MarketplaceTestScreen';
import ProductSelectionScreen from './src/screens/ProductSelectionScreen';
import BrandSelectionScreen from './src/screens/BrandSelectionScreen';
import ModelSelectionScreen from './src/screens/ModelSelectionScreen';
import ExactPricingScreen from './src/screens/ExactPricingScreen';
import CameraScreen from './src/screens/CameraScreen';
import ImageDatasetScreen from './src/screens/ImageDatasetScreen';

// Import components
import CustomTabBar from './src/components/CustomTabBar';

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
  return (
    <PaperProvider theme={theme as any}>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="ItemConfirmation" component={ItemConfirmationScreen} />
            <Stack.Screen name="MarketplaceTest" component={MarketplaceTestScreen} />
            <Stack.Screen name="ProductSelection" component={ProductSelectionScreen} />
            <Stack.Screen name="BrandSelection" component={BrandSelectionScreen} />
            <Stack.Screen name="ModelSelection" component={ModelSelectionScreen} />
            <Stack.Screen name="ExactPricing" component={ExactPricingScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="ImageDataset" component={ImageDatasetScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </PaperProvider>
  );
}
