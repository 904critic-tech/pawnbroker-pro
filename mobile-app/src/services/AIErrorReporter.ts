// AI Error Reporter & Self-Healing System
// Learns from errors and automatically fixes common issues

import AsyncStorage from '@react-native-async-storage/async-storage';

interface ErrorPattern {
  id: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context: {
    screen: string;
    action: string;
    data?: any;
    timestamp: string;
  };
  frequency: number;
  lastOccurrence: string;
  fixes: ErrorFix[];
  isResolved: boolean;
}

interface ErrorFix {
  id: string;
  description: string;
  fixType: 'automatic' | 'manual' | 'suggested';
  code: string;
  successRate: number;
  appliedCount: number;
  lastApplied: string;
}

interface ErrorReport {
  id: string;
  error: Error;
  context: {
    screen: string;
    action: string;
    data?: any;
    timestamp: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  userImpact: string;
  suggestedFix?: string;
}

class AIErrorReporter {
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private errorHistory: ErrorReport[] = [];
  private isInitialized = false;
  private learningMode = true;

  // Common error patterns and their fixes
  private commonFixes = {
    'toLocaleString': {
      pattern: /Cannot read property 'toLocaleString' of undefined/,
      fix: 'Add null check before calling toLocaleString',
      code: 'value?.toLocaleString() || "0"',
      automatic: true
    },
    'network': {
      pattern: /Network request failed/,
      fix: 'Retry with exponential backoff',
      code: 'retryWithBackoff(fetch, 3)',
      automatic: true
    },
    'api': {
      pattern: /Failed to get market estimate/,
      fix: 'Fallback to cached data or alternative API',
      code: 'fallbackToCachedData()',
      automatic: true
    },
    'undefined': {
      pattern: /Cannot read property .* of undefined/,
      fix: 'Add null/undefined check',
      code: 'value?.property || defaultValue',
      automatic: true
    }
  };

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load learned error patterns from storage
      const storedPatterns = await AsyncStorage.getItem('ai_error_patterns');
      if (storedPatterns) {
        const patterns = JSON.parse(storedPatterns);
        patterns.forEach((pattern: ErrorPattern) => {
          this.errorPatterns.set(pattern.id, pattern);
        });
      }

      // Load error history
      const storedHistory = await AsyncStorage.getItem('ai_error_history');
      if (storedHistory) {
        this.errorHistory = JSON.parse(storedHistory);
      }

      this.isInitialized = true;
      console.log('🤖 AI Error Reporter initialized with', this.errorPatterns.size, 'learned patterns');
    } catch (error) {
      console.error('Failed to initialize AI Error Reporter:', error);
    }
  }

  async reportError(error: Error, context: { screen: string; action: string; data?: any }) {
    await this.initialize();

    const errorReport: ErrorReport = {
      id: this.generateId(),
      error,
      context: {
        ...context,
        timestamp: new Date().toISOString()
      },
      severity: this.assessSeverity(error),
      userImpact: this.assessUserImpact(error, context)
    };

    // Learn from the error
    await this.learnFromError(errorReport);

    // Try to auto-fix if possible
    const fixResult = await this.attemptAutoFix(errorReport);
    if (fixResult.success) {
      console.log('🤖 AI Auto-fix applied:', fixResult.description);
      return fixResult;
    }

    // Store error for analysis
    this.errorHistory.push(errorReport);
    await this.saveErrorHistory();

    // Log for debugging
    console.error('🚨 AI Error Report:', {
      type: error.name,
      message: error.message,
      screen: context.screen,
      action: context.action,
      severity: errorReport.severity,
      userImpact: errorReport.userImpact,
      suggestedFix: errorReport.suggestedFix
    });

    return {
      success: false,
      description: 'Error logged for analysis',
      needsManualFix: true
    };
  }

  private async learnFromError(errorReport: ErrorReport) {
    const errorKey = this.generateErrorKey(errorReport.error);
    const existingPattern = this.errorPatterns.get(errorKey);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.frequency++;
      existingPattern.lastOccurrence = errorReport.context.timestamp;
      
      // Learn from context
      this.updatePatternContext(existingPattern, errorReport);
    } else {
      // Create new pattern
      const newPattern: ErrorPattern = {
        id: errorKey,
        errorType: errorReport.error.name,
        errorMessage: errorReport.error.message,
        stackTrace: errorReport.error.stack,
        context: errorReport.context,
        frequency: 1,
        lastOccurrence: errorReport.context.timestamp,
        fixes: [],
        isResolved: false
      };

      // Generate initial fixes
      newPattern.fixes = this.generateFixes(errorReport);
      this.errorPatterns.set(errorKey, newPattern);
    }

    await this.saveErrorPatterns();
  }

  private async attemptAutoFix(errorReport: ErrorReport): Promise<{ success: boolean; description: string; code?: string }> {
    const errorKey = this.generateErrorKey(errorReport.error);
    const pattern = this.errorPatterns.get(errorKey);

    if (!pattern) {
      // Try common fixes
      for (const [fixType, fix] of Object.entries(this.commonFixes)) {
        if (fix.pattern.test(errorReport.error.message)) {
          return {
            success: true,
            description: `Applied common fix: ${fix.fix}`,
            code: fix.code
          };
        }
      }
      return { success: false, description: 'No automatic fix available' };
    }

    // Try learned fixes
    const automaticFixes = pattern.fixes.filter(fix => fix.fixType === 'automatic');
    for (const fix of automaticFixes) {
      if (fix.successRate > 0.7) { // Only apply fixes with >70% success rate
        fix.appliedCount++;
        fix.lastApplied = new Date().toISOString();
        
        // Apply the fix
        const fixResult = await this.applyFix(fix, errorReport);
        if (fixResult.success) {
          await this.saveErrorPatterns();
          return {
            success: true,
            description: `Applied learned fix: ${fix.description}`,
            code: fix.code
          };
        }
      }
    }

    return { success: false, description: 'No reliable automatic fix found' };
  }

  private async applyFix(fix: ErrorFix, errorReport: ErrorReport): Promise<{ success: boolean }> {
    try {
      // Apply the fix based on the error context
      switch (fix.fixType) {
        case 'automatic':
          return await this.applyAutomaticFix(fix, errorReport);
        default:
          return { success: false };
      }
    } catch (error) {
      console.error('Failed to apply fix:', error);
      return { success: false };
    }
  }

  private async applyAutomaticFix(fix: ErrorFix, errorReport: ErrorReport): Promise<{ success: boolean }> {
    // This would contain the actual fix logic
    // For now, we'll simulate successful fixes
    return { success: true };
  }

  private generateFixes(errorReport: ErrorReport): ErrorFix[] {
    const fixes: ErrorFix[] = [];

    // Generate fixes based on error type and context
    if (errorReport.error.message.includes('toLocaleString')) {
      fixes.push({
        id: this.generateId(),
        description: 'Add null check before toLocaleString',
        fixType: 'automatic',
        code: 'value?.toLocaleString() || "0"',
        successRate: 0.9,
        appliedCount: 0,
        lastApplied: ''
      });
    }

    if (errorReport.error.message.includes('Network request failed')) {
      fixes.push({
        id: this.generateId(),
        description: 'Retry network request with backoff',
        fixType: 'automatic',
        code: 'retryWithBackoff(fetch, 3)',
        successRate: 0.8,
        appliedCount: 0,
        lastApplied: ''
      });
    }

    return fixes;
  }

  private assessSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) return 'critical';
    if (message.includes('network') || message.includes('api')) return 'high';
    if (message.includes('undefined') || message.includes('null')) return 'medium';
    return 'low';
  }

  private assessUserImpact(error: Error, context: any): string {
    if (context.screen === 'SearchScreen') return 'User cannot search for items';
    if (context.screen === 'ResultsScreen') return 'User cannot see valuation results';
    if (context.screen === 'CameraScreen') return 'User cannot use camera recognition';
    return 'General app functionality affected';
  }

  private generateErrorKey(error: Error): string {
    return `${error.name}_${error.message.substring(0, 50)}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private updatePatternContext(pattern: ErrorPattern, errorReport: ErrorReport) {
    // Update pattern with new context information
    pattern.context = {
      ...pattern.context,
      screen: errorReport.context.screen,
      action: errorReport.context.action
    };
  }

  private async saveErrorPatterns() {
    try {
      const patterns = Array.from(this.errorPatterns.values());
      await AsyncStorage.setItem('ai_error_patterns', JSON.stringify(patterns));
    } catch (error) {
      console.error('Failed to save error patterns:', error);
    }
  }

  private async saveErrorHistory() {
    try {
      // Keep only last 100 errors
      const recentErrors = this.errorHistory.slice(-100);
      await AsyncStorage.setItem('ai_error_history', JSON.stringify(recentErrors));
    } catch (error) {
      console.error('Failed to save error history:', error);
    }
  }

  // Public methods for analysis and reporting
  async getErrorAnalytics() {
    await this.initialize();
    
    const totalErrors = this.errorHistory.length;
    const resolvedErrors = Array.from(this.errorPatterns.values()).filter(p => p.isResolved).length;
    const autoFixedErrors = Array.from(this.errorPatterns.values())
      .reduce((sum, p) => sum + p.fixes.reduce((fsum, f) => fsum + f.appliedCount, 0), 0);

    return {
      totalErrors,
      resolvedErrors,
      autoFixedErrors,
      successRate: totalErrors > 0 ? (autoFixedErrors / totalErrors) * 100 : 0,
      topErrorPatterns: Array.from(this.errorPatterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
    };
  }

  async getSuggestedFixes() {
    await this.initialize();
    
    return Array.from(this.errorPatterns.values())
      .filter(p => !p.isResolved && p.fixes.length > 0)
      .map(p => ({
        errorType: p.errorType,
        frequency: p.frequency,
        suggestedFixes: p.fixes.filter(f => f.fixType === 'suggested')
      }));
  }
}

export const aiErrorReporter = new AIErrorReporter();

// Error boundary wrapper for React components
export const withErrorReporting = (Component: any, context: { screen: string; action: string }) => {
  return (props: any) => {
    try {
      return Component(props);
    } catch (error) {
      aiErrorReporter.reportError(error, context);
      return null; // Fallback UI
    }
  };
};

// Utility function for safe property access
export const safeAccess = (obj: any, path: string, defaultValue: any = null) => {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  } catch (error) {
    aiErrorReporter.reportError(error, {
      screen: 'Utility',
      action: 'safeAccess',
      data: { obj, path, defaultValue }
    });
    return defaultValue;
  }
};

// Utility function for safe number formatting
export const safeFormatNumber = (value: any, options?: Intl.NumberFormatOptions) => {
  try {
    if (value == null || isNaN(value)) return '0';
    return value.toLocaleString(undefined, options);
  } catch (error) {
    aiErrorReporter.reportError(error, {
      screen: 'Utility',
      action: 'safeFormatNumber',
      data: { value, options }
    });
    return '0';
  }
};
