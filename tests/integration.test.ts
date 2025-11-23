/**
 * Integration Tests
 *
 * These tests run against a real Phlag server. They are disabled by default
 * and only run when the PHLAG_INTEGRATION_TEST environment variable is set.
 *
 * Setup:
 * 1. Start a Phlag server locally or use a test instance
 * 2. Create test flags in the Phlag admin interface
 * 3. Generate an API key
 * 4. Set environment variables:
 *    - PHLAG_URL (e.g., http://localhost:8000)
 *    - PHLAG_API_KEY (your 64-character API key)
 *    - PHLAG_INTEGRATION_TEST=true
 *
 * Run:
 * PHLAG_INTEGRATION_TEST=true PHLAG_URL=http://localhost:8000 PHLAG_API_KEY=your-key npm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PhlagClient } from '../src/PhlagClient';
import { AuthenticationError, InvalidEnvironmentError, InvalidFlagError } from '../src/exceptions';

const shouldRunIntegrationTests = process.env.PHLAG_INTEGRATION_TEST === 'true';

const skipIfNoServer = shouldRunIntegrationTests ? describe : describe.skip;

skipIfNoServer('Integration Tests (Real Phlag Server)', () => {
  const baseUrl = process.env.PHLAG_URL || 'http://localhost:8000';
  const apiKey = process.env.PHLAG_API_KEY || '';
  const environment = process.env.PHLAG_ENVIRONMENT || 'development';

  let client: PhlagClient;

  beforeAll(() => {
    if (!apiKey) {
      throw new Error('PHLAG_API_KEY environment variable must be set for integration tests');
    }

    client = new PhlagClient({
      baseUrl,
      apiKey,
      environment,
    });
  });

  describe('Basic Connectivity', () => {
    it('should connect to Phlag server', async () => {
      // This test verifies basic connectivity
      // We expect either a valid response or a specific error
      try {
        const result = await client.getFlag('test_flag');
        // If successful, result should be a valid flag value or null
        expect(result === null || typeof result === 'boolean').toBe(true);
      } catch (error) {
        // If it fails, it should be a known error type
        expect(error instanceof InvalidFlagError || error instanceof InvalidEnvironmentError).toBe(
          true
        );
      }
    });

    it('should handle authentication correctly', async () => {
      const badClient = new PhlagClient({
        baseUrl,
        apiKey: 'invalid-key-that-should-fail',
        environment,
      });

      await expect(badClient.getFlag('any_flag')).rejects.toThrow(AuthenticationError);
    });

    it('should handle invalid environment', async () => {
      const badEnvClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: 'nonexistent_environment_12345',
      });

      // Server may return null for invalid environment or throw error
      const result = await badEnvClient.getFlag('any_flag');
      expect(result === null || result instanceof Error).toBe(true);
    });
  });

  describe('Flag Operations', () => {
    it('should retrieve boolean flags (if exists)', async () => {
      // Note: This test assumes you have a boolean flag in your test server
      // If the flag doesn't exist, it will throw InvalidFlagError
      try {
        const result = await client.isEnabled('test_boolean_flag');
        expect(typeof result).toBe('boolean');
      } catch (error) {
        if (error instanceof InvalidFlagError) {
          console.log('Skipping: test_boolean_flag not found in server');
        } else {
          throw error;
        }
      }
    });

    it('should retrieve number flags (if exists)', async () => {
      try {
        const result = await client.getFlag('test_number_flag');
        expect(result === null || typeof result === 'number').toBe(true);
      } catch (error) {
        if (error instanceof InvalidFlagError) {
          console.log('Skipping: test_number_flag not found in server');
        } else {
          throw error;
        }
      }
    });

    it('should retrieve string flags (if exists)', async () => {
      try {
        const result = await client.getFlag('test_string_flag');
        expect(result === null || typeof result === 'string').toBe(true);
      } catch (error) {
        if (error instanceof InvalidFlagError) {
          console.log('Skipping: test_string_flag not found in server');
        } else {
          throw error;
        }
      }
    });

    it('should handle non-existent flags', async () => {
      // Server may return null for non-existent flags or throw error
      const result = await client.getFlag('flag_that_definitely_does_not_exist_12345');
      expect(result).toBe(null);
    });
  });

  describe('Caching with Real Server', () => {
    it('should cache flags from real server', async () => {
      const cachedClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
        cacheTtl: 60,
      });

      // First request - should fetch from server
      const start1 = Date.now();
      try {
        await cachedClient.getFlag('any_flag');
      } catch {
        // Flag might not exist, that's ok
      }
      const duration1 = Date.now() - start1;

      // Second request - should be from cache (much faster)
      const start2 = Date.now();
      try {
        await cachedClient.getFlag('any_flag');
      } catch {
        // Flag might not exist, that's ok
      }
      const duration2 = Date.now() - start2;

      // Cached request should be significantly faster (< 5ms vs 10-50ms)
      expect(duration2).toBeLessThan(duration1);
      expect(duration2).toBeLessThan(5);

      // Cleanup
      await cachedClient.clearCache();
    });

    it('should warm cache from real server', async () => {
      const cachedClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      // Warm the cache
      await cachedClient.warmCache();

      // Subsequent requests should be instant
      const start = Date.now();
      try {
        await cachedClient.getFlag('any_flag');
      } catch {
        // Flag might not exist, that's ok
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5);

      // Cleanup
      await cachedClient.clearCache();
    });
  });

  describe('Multi-Environment', () => {
    it('should switch environments', async () => {
      const prodClient = client.withEnvironment('production');

      expect(prodClient.getEnvironment()).toBe('production');
      expect(client.getEnvironment()).toBe(environment); // Original unchanged

      // Should be able to query the new environment
      try {
        await prodClient.getFlag('any_flag');
      } catch (error) {
        // Expect either success or known error types
        expect(error instanceof InvalidFlagError || error instanceof InvalidEnvironmentError).toBe(
          true
        );
      }
    });
  });

  describe('Error Recovery', () => {
    it('should handle network timeout gracefully', async () => {
      const timeoutClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        timeout: 1, // 1ms timeout - will likely fail
      });

      await expect(timeoutClient.getFlag('any_flag')).rejects.toThrow();
    });

    it('should handle server errors gracefully', async () => {
      const badUrlClient = new PhlagClient({
        baseUrl: 'http://localhost:99999', // Non-existent server
        apiKey,
        environment,
        timeout: 1000,
      });

      await expect(badUrlClient.getFlag('any_flag')).rejects.toThrow();
    });
  });
});

// Instructions for setting up test flags
if (shouldRunIntegrationTests) {
  console.log(`
=== Integration Tests Running ===

Server: ${process.env.PHLAG_URL}
Environment: ${process.env.PHLAG_ENVIRONMENT || 'development'}

For best results, create these test flags in your Phlag server:
- test_boolean_flag (SWITCH type)
- test_number_flag (INTEGER type)
- test_string_flag (STRING type)

Some tests will be skipped if these flags don't exist.
`);
}
