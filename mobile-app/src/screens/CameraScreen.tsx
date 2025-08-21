import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { theme, spacing, shadows } from '../theme/theme';
import LearningService from '../services/LearningService';
import TensorFlowModel from '../services/TensorFlowModel';
import { API_BASE_URL } from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OCRResult {
  extractedText: string;
  brand: string | null;
  model: string | null;
  confidence: number;
  category?: string;
  detectedObjects?: any[];
  labels?: any[];
}

const CameraScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [permission, requestPermission] = ImagePicker.useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOCRResult, setLastOCRResult] = useState<OCRResult | null>(null);
  
  const learningService = LearningService.getInstance();
  const tensorFlowModel = TensorFlowModel.getInstance();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await processImageWithBackend(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      if (!permission?.granted) {
        await requestPermission();
      }

      if (!permission?.granted) {
        Alert.alert(
          'Camera Permission Required',
          'This app needs camera access to identify products. Please enable camera permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {/* Open device settings */ } }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        await processImageWithBackend(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const processImageWithBackend = async (imageUri: string): Promise<OCRResult | null> => {
    try {
      setIsProcessing(true);
      console.log('🔍 Starting backend image recognition for:', imageUri);
      
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      
      // Send to backend for Google Cloud Vision analysis
      const backendResponse = await fetch(`${API_BASE_URL}/images/recognize`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend request failed: ${backendResponse.status}`);
      }

      const backendResult = await backendResponse.json();
      console.log('🔍 Backend recognition result:', backendResult);

      if (!backendResult.success) {
        throw new Error(backendResult.message || 'Backend recognition failed');
      }

      // Extract product information from backend result
      const productInfo = backendResult.productInfo;
      const analysis = backendResult.analysis;

      // Combine backend results with local learning service
      let finalBrand = productInfo.brand;
      let finalModel = productInfo.model;
      let finalCategory = productInfo.category;
      let confidence = productInfo.confidence || 0.5;

      // If backend didn't identify brand/model, try local learning service
      if (!finalBrand || !finalModel) {
        const extractedText = productInfo.extractedText || '';
        if (extractedText) {
          const localResult = learningService.extractBrandAndModelFromTitle(extractedText);
          if (!finalBrand && localResult.brand) {
            finalBrand = localResult.brand;
            confidence += 0.2;
          }
          if (!finalModel && localResult.model) {
            finalModel = localResult.model;
            confidence += 0.2;
          }
        }
      }

      // Try TensorFlow if available and backend didn't provide good results
      if (confidence < 0.6 && tensorFlowModel.isModelReady()) {
        try {
          console.log('🔍 Attempting TensorFlow image recognition...');
          const tensorFlowResult = await tensorFlowModel.predictImage(imageUri);
          if (tensorFlowResult && tensorFlowResult.confidence > 0.7) {
            if (!finalBrand) finalBrand = tensorFlowResult.brand;
            if (!finalModel) finalModel = tensorFlowResult.model;
            confidence = Math.max(confidence, tensorFlowResult.confidence);
            console.log('🎯 Using TensorFlow result to enhance recognition');
          }
        } catch (error) {
          console.log('⚠️ TensorFlow recognition failed:', error);
        }
      }

      const result: OCRResult = {
        extractedText: productInfo.extractedText || '',
        brand: finalBrand,
        model: finalModel,
        confidence: Math.min(confidence, 0.95),
        category: finalCategory,
        detectedObjects: analysis.objects || [],
        labels: analysis.labels || [],
      };

      console.log('🎯 Final combined result:', result);
      setLastOCRResult(result);
      showOCRResults(result);
      return result;
    } catch (error) {
      console.error('❌ Backend image processing failed:', error);
      
      // Fallback to local processing if backend fails
      console.log('🔄 Falling back to local processing...');
      return await processImageLocally(imageUri);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImageLocally = async (imageUri: string): Promise<OCRResult | null> => {
    try {
      console.log('🔍 Starting local image processing...');
      
      // Try TensorFlow if available
      let tensorFlowResult = null;
      if (tensorFlowModel.isModelReady()) {
        try {
          tensorFlowResult = await tensorFlowModel.predictImage(imageUri);
          console.log('🔍 TensorFlow result:', tensorFlowResult);
        } catch (error) {
          console.log('⚠️ TensorFlow recognition failed:', error);
        }
      }

      // Use learning service for text-based recognition
      let finalBrand: string | null = null;
      let finalModel: string | null = null;
      let confidence = 0.5;

      if (tensorFlowResult && tensorFlowResult.confidence > 0.7) {
        finalBrand = tensorFlowResult.brand;
        finalModel = tensorFlowResult.model;
        confidence = tensorFlowResult.confidence;
        console.log('🎯 Using TensorFlow result (high confidence)');
      } else {
        // Fall back to basic recognition
        console.log('🔍 Using basic recognition fallback');
        confidence = 0.3;
      }

      const result: OCRResult = {
        extractedText: '',
        brand: finalBrand,
        model: finalModel,
        confidence,
        category: null,
        detectedObjects: [],
        labels: [],
      };

      console.log('🎯 Local processing result:', result);
      setLastOCRResult(result);
      showOCRResults(result);
      return result;
    } catch (error) {
      console.error('❌ Local image processing failed:', error);
      Alert.alert(
        'Processing Failed',
        'Failed to process the image. Please try again with a clearer image.',
        [{ text: 'OK' }]
      );
      return null;
    }
  };

  const showOCRResults = (result: OCRResult) => {
    const details = [
      `Brand: ${result.brand || 'Unknown'}`,
      `Model: ${result.model || 'Unknown'}`,
      `Confidence: ${Math.round(result.confidence * 100)}%`,
    ];

    if (result.category) {
      details.push(`Category: ${result.category}`);
    }

    if (result.extractedText) {
      details.push(`Text: ${result.extractedText.substring(0, 100)}${result.extractedText.length > 100 ? '...' : ''}`);
    }

    if (result.labels && result.labels.length > 0) {
      const topLabels = result.labels.slice(0, 3).map(l => l.description).join(', ');
      details.push(`Labels: ${topLabels}`);
    }

    Alert.alert(
      'Image Recognition Results',
      details.join('\n\n'),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Search',
          onPress: () => {
            const searchQuery = result.brand && result.model 
              ? `${result.brand} ${result.model}`
              : result.extractedText || 'Unknown Item';
            
            // Navigate to search with the extracted information
            (navigation as any).navigate('Search', { 
              initialQuery: searchQuery,
              ocrResult: result 
            });
          },
        },
      ]
    );
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="bodyMedium" style={{ color: colors.onSurface, marginTop: spacing.md }}>
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text variant="headlineSmall" style={{ color: colors.onBackground, textAlign: 'center' }}>
            Camera Permission Required
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }}>
            This app needs camera access to identify products. Please enable camera permissions in your device settings.
          </Text>
          <Button mode="contained" onPress={requestPermission} style={{ marginTop: spacing.lg }}>
            Grant Permission
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContent}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text variant="titleLarge" style={{ color: colors.onSurface, flex: 1, textAlign: 'center' }}>
            Scan Product
          </Text>
          <View style={{ width: 48 }} />
        </View>
      </Surface>

      {/* Image Display or Camera Options */}
      <View style={styles.cameraContainer}>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.capturedImage} resizeMode="contain" />
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.processingText, { color: colors.onSurface }]}>
                  Processing image...
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text variant="titleMedium" style={{ color: colors.onSurface, textAlign: 'center' }}>
              Choose an image to scan
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }}>
              Take a photo or select from gallery to identify products
            </Text>
          </View>
        )}
      </View>

      {/* Camera Controls */}
      <Surface style={[styles.controls, { backgroundColor: colors.surface }]}>
        <View style={styles.controlsRow}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={isProcessing}
            style={styles.secondaryButton}
          >
            Cancel
          </Button>
          
          <TouchableOpacity
            style={[
              styles.captureButton,
              { backgroundColor: colors.primary },
              isProcessing && styles.captureButtonDisabled
            ]}
            onPress={takePhoto}
            disabled={isProcessing}
          >
            <IconButton
              icon="camera"
              size={32}
              iconColor={colors.onPrimary}
            />
          </TouchableOpacity>
          
          <Button
            mode="outlined"
            onPress={pickImage}
            disabled={isProcessing}
            style={styles.secondaryButton}
          >
            Gallery
          </Button>
        </View>
        
        <Button
          mode="text"
          onPress={() => (navigation as any).navigate('Search')}
          disabled={isProcessing}
          style={styles.manualSearchButton}
        >
          Manual Search
        </Button>
      </Surface>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...shadows.small,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  processingText: {
    marginTop: spacing.md,
    fontSize: 18,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.medium,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    minWidth: 80,
  },
  manualSearchButton: {
    marginTop: spacing.md,
  },
});

export default CameraScreen;
