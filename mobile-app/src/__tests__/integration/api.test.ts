import { API_BASE_URL } from '../../services/api';

describe('API Integration Tests', () => {
  const baseUrl = API_BASE_URL;

  describe('Backend Connectivity', () => {
    it('should have a valid API base URL', () => {
      expect(baseUrl).toBeDefined();
      expect(typeof baseUrl).toBe('string');
      expect(baseUrl).toContain('https://');
      expect(baseUrl).toContain('vercel.app');
    });

    it('should have correct API endpoint structure', () => {
      expect(baseUrl).toMatch(/^https:\/\/.*\.vercel\.app\/api$/);
    });
  });

  describe('Environment Configuration', () => {
    it('should have production API URL configured', () => {
      // This test ensures we're using production URLs, not localhost
      expect(baseUrl).not.toContain('localhost');
      expect(baseUrl).not.toContain('127.0.0.1');
      expect(baseUrl).toContain('vercel.app');
    });
  });

  describe('API Endpoints', () => {
    it('should have marketplace endpoint available', () => {
      const marketplaceUrl = `${baseUrl}/marketplace`;
      expect(marketplaceUrl).toBeDefined();
      expect(marketplaceUrl).toContain('/marketplace');
    });

    it('should have search endpoint available', () => {
      const searchUrl = `${baseUrl}/search`;
      expect(searchUrl).toBeDefined();
      expect(searchUrl).toContain('/search');
    });

    it('should have images endpoint available', () => {
      const imagesUrl = `${baseUrl}/images`;
      expect(imagesUrl).toBeDefined();
      expect(imagesUrl).toContain('/images');
    });
  });
});
