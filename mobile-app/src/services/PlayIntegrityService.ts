import { Platform } from 'react-native';
import { ENVIRONMENT } from '../config/environment';

// Google Play Integrity API Response Types
export interface RequestDetails {
  requestPackageName: string;
  timestampMillis: string;
  nonce: string;
}

export interface AppIntegrity {
  appRecognitionVerdict: 'PLAY_RECOGNIZED' | 'UNRECOGNIZED_VERSION' | 'UNEVALUATED';
  packageName: string;
  certificateSha256Digest: string[];
  versionCode: string;
}

export interface DeviceIntegrity {
  deviceRecognitionVerdict: (
    | 'MEETS_DEVICE_INTEGRITY'
    | 'MEETS_BASIC_INTEGRITY'
    | 'MEETS_STRONG_INTEGRITY'
    | 'MEETS_VIRTUAL_INTEGRITY'
    | 'DOES_NOT_MEET_DEVICE_INTEGRITY'
    | 'DOES_NOT_MEET_BASIC_INTEGRITY'
    | 'DOES_NOT_MEET_STRONG_INTEGRITY'
    | 'DOES_NOT_MEET_VIRTUAL_INTEGRITY'
  )[];
}

export interface AccountDetails {
  appLicensingVerdict: 'LICENSED' | 'UNLICENSED' | 'UNEVALUATED';
}

export interface PlayIntegrityResponse {
  requestDetails: RequestDetails;
  appIntegrity: AppIntegrity;
  deviceIntegrity: DeviceIntegrity;
  accountDetails: AccountDetails;
}

export interface IntegrityCheckResult {
  success: boolean;
  response?: PlayIntegrityResponse;
  error?: string;
  isTrusted: boolean;
  recommendations: string[];
  securityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNTRUSTED';
}

// Google Play Console Configuration Settings
export interface PlayIntegrityConfig {
  deviceIntegrity: {
    enabled: boolean;
    verdicts: string[];
  };
  applicationIntegrity: {
    enabled: boolean;
    verdicts: string[];
  };
  accountDetails: {
    enabled: boolean;
    verdicts: string[];
  };
}

class PlayIntegrityService {
  private static instance: PlayIntegrityService;
  private isInitialized: boolean = false;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Configuration matching Google Play Console settings
  private readonly CONFIG: PlayIntegrityConfig = {
    deviceIntegrity: {
      enabled: true,
      verdicts: ['MEETS_DEVICE_INTEGRITY']
    },
    applicationIntegrity: {
      enabled: true,
      verdicts: ['PLAY_RECOGNIZED', 'UNRECOGNIZED_VERSION', 'UNEVALUATED']
    },
    accountDetails: {
      enabled: true,
      verdicts: ['LICENSED', 'UNLICENSED', 'UNEVALUATED']
    }
  };

  private constructor() {}

  public static getInstance(): PlayIntegrityService {
    if (!PlayIntegrityService.instance) {
      PlayIntegrityService.instance = new PlayIntegrityService();
    }
    return PlayIntegrityService.instance;
  }

  /**
   * Initialize the Play Integrity service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Only available on Android
      if (Platform.OS !== 'android') {
        console.log('Play Integrity API only available on Android');
        this.isInitialized = true;
        return;
      }

      // Check if Google Play Services are available
      const hasPlayServices = await this.checkGooglePlayServices();
      if (!hasPlayServices) {
        console.warn('Google Play Services not available');
        this.isInitialized = true;
        return;
      }

      this.isInitialized = true;
      console.log('Play Integrity Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Play Integrity Service:', error);
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  /**
   * Perform integrity check with the provided nonce
   */
  public async performIntegrityCheck(nonce?: string): Promise<IntegrityCheckResult> {
    try {
      // Check if we should perform a new check (rate limiting)
      const now = Date.now();
      if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
        console.log('Integrity check rate limited, using cached result');
        return this.getCachedResult();
      }

      // Generate nonce if not provided
      const integrityNonce = nonce || this.generateNonce();

      // Create request details
      const requestDetails: RequestDetails = {
        requestPackageName: 'com.pawnbrokerpro.android',
        timestampMillis: now.toString(),
        nonce: integrityNonce
      };

      // Perform the actual integrity check
      const response = await this.callPlayIntegrityAPI(requestDetails);
      
      // Analyze the response based on Google Play Console configuration
      const result = this.analyzeIntegrityResponse(response);
      
      // Cache the result
      this.lastCheckTime = now;
      this.cacheResult(result);

      return result;
    } catch (error) {
      console.error('Integrity check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isTrusted: false,
        securityLevel: 'UNTRUSTED',
        recommendations: ['Check network connection', 'Verify Google Play Services']
      };
    }
  }

  /**
   * Generate a secure nonce for integrity checks
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Call the Google Play Integrity API
   */
  private async callPlayIntegrityAPI(requestDetails: RequestDetails): Promise<PlayIntegrityResponse> {
    // In a real implementation, this would call the actual Google Play Integrity API
    // For now, we'll simulate the response structure based on Google Play Console configuration
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          requestDetails,
          appIntegrity: {
            appRecognitionVerdict: 'PLAY_RECOGNIZED',
            packageName: 'com.pawnbrokerpro.android',
            certificateSha256Digest: [
              '6a6a1474b5cbbb2b1aa57e0bc3'
            ],
            versionCode: '42'
          },
          deviceIntegrity: {
            deviceRecognitionVerdict: [
              'MEETS_DEVICE_INTEGRITY'
            ]
          },
          accountDetails: {
            appLicensingVerdict: 'LICENSED'
          }
        });
      }, 100); // Simulate API delay
    });
  }

  /**
   * Analyze the integrity response based on Google Play Console configuration
   */
  private analyzeIntegrityResponse(response: PlayIntegrityResponse): IntegrityCheckResult {
    const recommendations: string[] = [];
    let isTrusted = true;
    let securityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNTRUSTED' = 'HIGH';

    // Check application integrity (enabled in Google Play Console)
    if (this.CONFIG.applicationIntegrity.enabled) {
      const appVerdict = response.appIntegrity.appRecognitionVerdict;
      
      switch (appVerdict) {
        case 'PLAY_RECOGNIZED':
          // App is recognized and trusted
          break;
        case 'UNRECOGNIZED_VERSION':
          isTrusted = false;
          securityLevel = 'MEDIUM';
          recommendations.push('App version not recognized by Google Play');
          break;
        case 'UNEVALUATED':
          isTrusted = false;
          securityLevel = 'LOW';
          recommendations.push('App integrity could not be evaluated');
          break;
        default:
          isTrusted = false;
          securityLevel = 'UNTRUSTED';
          recommendations.push('Unknown app integrity status');
      }
    }

    // Check device integrity (enabled in Google Play Console)
    if (this.CONFIG.deviceIntegrity.enabled) {
      const deviceVerdicts = response.deviceIntegrity.deviceRecognitionVerdict;
      const hasDeviceIntegrity = deviceVerdicts.includes('MEETS_DEVICE_INTEGRITY');
      
      if (!hasDeviceIntegrity) {
        isTrusted = false;
        securityLevel = securityLevel === 'HIGH' ? 'MEDIUM' : 'LOW';
        recommendations.push('Device integrity check failed');
      }
    }

    // Check account details (enabled in Google Play Console)
    if (this.CONFIG.accountDetails.enabled) {
      const licensingVerdict = response.accountDetails.appLicensingVerdict;
      
      switch (licensingVerdict) {
        case 'LICENSED':
          // App is properly licensed
          break;
        case 'UNLICENSED':
          isTrusted = false;
          securityLevel = 'UNTRUSTED';
          recommendations.push('App licensing verification failed');
          break;
        case 'UNEVALUATED':
          isTrusted = false;
          securityLevel = securityLevel === 'HIGH' ? 'MEDIUM' : 'LOW';
          recommendations.push('App licensing could not be evaluated');
          break;
        default:
          isTrusted = false;
          securityLevel = 'UNTRUSTED';
          recommendations.push('Unknown licensing status');
      }
    }

    // Additional security checks
    if (response.requestDetails.packageName !== 'com.pawnbrokerpro.android') {
      isTrusted = false;
      securityLevel = 'UNTRUSTED';
      recommendations.push('Package name mismatch');
    }

    return {
      success: true,
      response,
      isTrusted,
      securityLevel,
      recommendations
    };
  }

  /**
   * Check if Google Play Services are available
   */
  private async checkGooglePlayServices(): Promise<boolean> {
    // In a real implementation, this would check Google Play Services availability
    // For now, we'll assume they're available on Android
    return Platform.OS === 'android';
  }

  /**
   * Get cached integrity result
   */
  private getCachedResult(): IntegrityCheckResult {
    // In a real implementation, this would return the cached result
    // For now, return a default trusted result
    return {
      success: true,
      isTrusted: true,
      securityLevel: 'HIGH',
      recommendations: []
    };
  }

  /**
   * Cache the integrity result
   */
  private cacheResult(result: IntegrityCheckResult): void {
    // In a real implementation, this would cache the result
    // For now, just log it
    console.log('Caching integrity result:', result);
  }

  /**
   * Get integrity status for display
   */
  public getIntegrityStatus(): string {
    if (Platform.OS !== 'android') {
      return 'Not Available (iOS)';
    }
    
    if (!this.isInitialized) {
      return 'Initializing...';
    }

    return 'Active';
  }

  /**
   * Force a fresh integrity check (bypasses rate limiting)
   */
  public async forceIntegrityCheck(): Promise<IntegrityCheckResult> {
    this.lastCheckTime = 0; // Reset the timer
    return this.performIntegrityCheck();
  }

  /**
   * Get detailed integrity report
   */
  public async getDetailedReport(): Promise<{
    status: string;
    lastCheck: number;
    recommendations: string[];
    isTrusted: boolean;
    securityLevel: string;
    config: PlayIntegrityConfig;
  }> {
    const result = await this.performIntegrityCheck();
    
    return {
      status: result.success ? 'Verified' : 'Failed',
      lastCheck: this.lastCheckTime,
      recommendations: result.recommendations,
      isTrusted: result.isTrusted,
      securityLevel: result.securityLevel,
      config: this.CONFIG
    };
  }

  /**
   * Get the current configuration
   */
  public getConfiguration(): PlayIntegrityConfig {
    return this.CONFIG;
  }

  /**
   * Check if a specific integrity feature is enabled
   */
  public isFeatureEnabled(feature: keyof PlayIntegrityConfig): boolean {
    return this.CONFIG[feature].enabled;
  }

  /**
   * Get supported verdicts for a feature
   */
  public getSupportedVerdicts(feature: keyof PlayIntegrityConfig): string[] {
    return this.CONFIG[feature].verdicts;
  }
}

export default PlayIntegrityService;
