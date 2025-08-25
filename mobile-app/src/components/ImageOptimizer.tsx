import React, { useState, useEffect } from 'react';
import { Image, ImageStyle, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ImageOptimizerProps {
  source: { uri: string } | number;
  style: ImageStyle;
  placeholder?: React.ReactNode;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  enableCaching?: boolean;
  enableCompression?: boolean;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  source,
  style,
  placeholder,
  quality = 0.8,
  maxWidth = 800,
  maxHeight = 600,
  enableCaching = true,
  enableCompression = true,
  onLoad,
  onError
}) => {
  const [optimizedUri, setOptimizedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate cache key for the image
  const getCacheKey = (uri: string) => {
    const url = new URL(uri);
    const params = new URLSearchParams(url.search);
    params.set('quality', quality.toString());
    params.set('maxWidth', maxWidth.toString());
    params.set('maxHeight', maxHeight.toString());
    return `optimized_image_${url.pathname}_${params.toString()}`;
  };

  // Check if image is cached
  const getCachedImage = async (uri: string): Promise<string | null> => {
    if (!enableCaching) return null;
    
    try {
      const cacheKey = getCacheKey(uri);
      const cachedUri = await AsyncStorage.getItem(cacheKey);
      
      if (cachedUri) {
        // Check if cached file still exists
        const response = await fetch(cachedUri);
        if (response.ok) {
          return cachedUri;
        }
      }
    } catch (error) {
      console.warn('Cache check failed:', error);
    }
    
    return null;
  };

  // Cache optimized image
  const cacheOptimizedImage = async (originalUri: string, optimizedUri: string) => {
    if (!enableCaching) return;
    
    try {
      const cacheKey = getCacheKey(originalUri);
      await AsyncStorage.setItem(cacheKey, optimizedUri);
    } catch (error) {
      console.warn('Image caching failed:', error);
    }
  };

  // Optimize image
  const optimizeImage = async (uri: string): Promise<string> => {
    if (!enableCompression) return uri;

    try {
      const result = await manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight
            }
          }
        ],
        {
          compress: quality,
          format: SaveFormat.JPEG
        }
      );

      return result.uri;
    } catch (error) {
      console.warn('Image optimization failed:', error);
      return uri; // Return original if optimization fails
    }
  };

  // Load and optimize image
  const loadImage = async () => {
    if (typeof source === 'number') {
      // Local image resource
      setOptimizedUri(source.toString());
      setLoading(false);
      return;
    }

    const uri = source.uri;
    if (!uri) {
      setError('Invalid image source');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedUri = await getCachedImage(uri);
      if (cachedUri) {
        setOptimizedUri(cachedUri);
        setLoading(false);
        onLoad?.();
        return;
      }

      // Optimize image
      const optimized = await optimizeImage(uri);
      
      // Cache the optimized image
      await cacheOptimizedImage(uri, optimized);
      
      setOptimizedUri(optimized);
      setLoading(false);
      onLoad?.();
    } catch (error) {
      console.error('Image loading failed:', error);
      setError('Failed to load image');
      setLoading(false);
      onError?.(error);
    }
  };

  useEffect(() => {
    loadImage();
  }, [source, quality, maxWidth, maxHeight]);

  if (loading) {
    return (
      <View style={[style, styles.placeholder]}>
        {placeholder || (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[style, styles.placeholder]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Image failed to load</Text>
        </View>
      </View>
    );
  }

  return (
    <Image
      source={typeof source === 'number' ? source : { uri: optimizedUri! }}
      style={style}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ImageOptimizer;
