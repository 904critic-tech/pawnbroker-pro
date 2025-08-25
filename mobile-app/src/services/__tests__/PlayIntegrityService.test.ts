import PlayIntegrityService, {
  PlayIntegrityResponse,
  IntegrityCheckResult,
  PlayIntegrityConfig,
} from '../PlayIntegrityService';

describe('PlayIntegrityService', () => {
  let service: PlayIntegrityService;

  beforeEach(() => {
    service = PlayIntegrityService.getInstance();
  });

  describe('Configuration', () => {
    it('should return the correct Google Play Console configuration', () => {
      const config = service.getConfiguration();
      
      expect(config.deviceIntegrity.enabled).toBe(true);
      expect(config.deviceIntegrity.verdicts).toContain('MEETS_DEVICE_INTEGRITY');
      
      expect(config.applicationIntegrity.enabled).toBe(true);
      expect(config.applicationIntegrity.verdicts).toContain('PLAY_RECOGNIZED');
      expect(config.applicationIntegrity.verdicts).toContain('UNRECOGNIZED_VERSION');
      expect(config.applicationIntegrity.verdicts).toContain('UNEVALUATED');
      
      expect(config.accountDetails.enabled).toBe(true);
      expect(config.accountDetails.verdicts).toContain('LICENSED');
      expect(config.accountDetails.verdicts).toContain('UNLICENSED');
      expect(config.accountDetails.verdicts).toContain('UNEVALUATED');
    });

    it('should check if features are enabled correctly', () => {
      expect(service.isFeatureEnabled('deviceIntegrity')).toBe(true);
      expect(service.isFeatureEnabled('applicationIntegrity')).toBe(true);
      expect(service.isFeatureEnabled('accountDetails')).toBe(true);
    });

    it('should return supported verdicts for each feature', () => {
      const deviceVerdicts = service.getSupportedVerdicts('deviceIntegrity');
      expect(deviceVerdicts).toContain('MEETS_DEVICE_INTEGRITY');

      const appVerdicts = service.getSupportedVerdicts('applicationIntegrity');
      expect(appVerdicts).toContain('PLAY_RECOGNIZED');
      expect(appVerdicts).toContain('UNRECOGNIZED_VERSION');
      expect(appVerdicts).toContain('UNEVALUATED');

      const accountVerdicts = service.getSupportedVerdicts('accountDetails');
      expect(accountVerdicts).toContain('LICENSED');
      expect(accountVerdicts).toContain('UNLICENSED');
      expect(accountVerdicts).toContain('UNEVALUATED');
    });
  });

  describe('Integrity Check', () => {
    it('should perform integrity check and return valid result', async () => {
      const result = await service.performIntegrityCheck();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isTrusted).toBe(true);
      expect(result.securityLevel).toBe('HIGH');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should return response with correct structure', async () => {
      const result = await service.performIntegrityCheck();
      
      expect(result.response).toBeDefined();
      if (result.response) {
        expect(result.response.requestDetails.packageName).toBe('com.pawnbrokerpro.android');
        expect(result.response.appIntegrity.appRecognitionVerdict).toBe('PLAY_RECOGNIZED');
        expect(result.response.deviceIntegrity.deviceRecognitionVerdict).toContain('MEETS_DEVICE_INTEGRITY');
        expect(result.response.accountDetails.appLicensingVerdict).toBe('LICENSED');
      }
    });

    it('should handle forced integrity check', async () => {
      const result = await service.forceIntegrityCheck();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.isTrusted).toBe(true);
    });

    it('should return detailed report', async () => {
      const report = await service.getDetailedReport();
      
      expect(report).toBeDefined();
      expect(report.status).toBe('Verified');
      expect(report.isTrusted).toBe(true);
      expect(report.securityLevel).toBe('HIGH');
      expect(report.config).toBeDefined();
    });
  });

  describe('Security Levels', () => {
    it('should return HIGH security level for trusted device', async () => {
      const result = await service.performIntegrityCheck();
      expect(result.securityLevel).toBe('HIGH');
    });

    it('should include security level in result', async () => {
      const result = await service.performIntegrityCheck();
      expect(['HIGH', 'MEDIUM', 'LOW', 'UNTRUSTED']).toContain(result.securityLevel);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization gracefully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should return valid status', () => {
      const status = service.getIntegrityStatus();
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
    });
  });

  describe('Response Structure', () => {
    it('should match Google Play Console configuration', async () => {
      const result = await service.performIntegrityCheck();
      
      if (result.response) {
        // Check request details
        expect(result.response.requestDetails).toHaveProperty('requestPackageName');
        expect(result.response.requestDetails).toHaveProperty('timestampMillis');
        expect(result.response.requestDetails).toHaveProperty('nonce');

        // Check app integrity
        expect(result.response.appIntegrity).toHaveProperty('appRecognitionVerdict');
        expect(result.response.appIntegrity).toHaveProperty('packageName');
        expect(result.response.appIntegrity).toHaveProperty('certificateSha256Digest');
        expect(result.response.appIntegrity).toHaveProperty('versionCode');

        // Check device integrity
        expect(result.response.deviceIntegrity).toHaveProperty('deviceRecognitionVerdict');
        expect(Array.isArray(result.response.deviceIntegrity.deviceRecognitionVerdict)).toBe(true);

        // Check account details
        expect(result.response.accountDetails).toHaveProperty('appLicensingVerdict');
      }
    });
  });
});
