import React from 'react';
import { InteractionManager } from 'react-native';

/**
 * Performance Optimization Utilities
 * Handles lazy loading, memory management, and startup optimization
 */

// Lazy loading wrapper for components
export const lazyLoad = (importFunc: () => Promise<any>) => {
  return React.lazy(importFunc);
};

// Defer non-critical operations until after interactions
export const deferOperation = (operation: () => void) => {
  InteractionManager.runAfterInteractions(() => {
    operation();
  });
};

// Memory management utilities
export class MemoryManager {
  private static cache = new Map<string, any>();
  private static maxCacheSize = 50;

  static set(key: string, value: any): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  static get(key: string): any {
    return this.cache.get(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static remove(key: string): boolean {
    return this.cache.delete(key);
  }
}

// Image optimization utilities
export const optimizeImage = (uri: string, width: number, height: number): string => {
  // Add image optimization parameters
  const optimizedUri = `${uri}?w=${width}&h=${height}&fit=crop&auto=format`;
  return optimizedUri;
};

// Bundle size optimization
export const preloadCriticalResources = async () => {
  try {
    // Preload critical fonts, images, and data
    await Promise.all([
      // Add critical resource preloading here
    ]);
  } catch (error) {
    console.warn('Failed to preload critical resources:', error);
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startTimer(key: string): void {
    this.metrics.set(key, Date.now());
  }

  static endTimer(key: string): number {
    const startTime = this.metrics.get(key);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.metrics.delete(key);
      return duration;
    }
    return 0;
  }

  static logPerformance(key: string, duration: number): void {
    if (__DEV__) {
      console.log(`⏱️ Performance [${key}]: ${duration}ms`);
    }
  }
}

// Startup optimization
export const optimizeStartup = () => {
  // Disable debug features in production
  if (!__DEV__) {
    // Disable console logs in production
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
  }

  // Preload critical data
  deferOperation(() => {
    preloadCriticalResources();
  });
};
