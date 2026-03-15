import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PhlagClient } from '../src/PhlagClient.js';
import {
  AuthenticationError,
  InvalidFlagError,
  InvalidEnvironmentError,
  NetworkError,
} from '../src/exceptions/index.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('PhlagClient', () => {
  let client: PhlagClient;
  const baseUrl = 'http://localhost:8000';
  const apiKey = 'test-api-key-64-chars-long-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const environment = 'production';

  beforeEach(() => {
    client = new PhlagClient({
      baseUrl,
      apiKey,
      environment,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a client with required options', () => {
      expect(client).toBeDefined();
      expect(client.getEnvironment()).toEqual([environment]);
    });

    it('should use default timeout if not provided', () => {
      const defaultClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
      });
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const customClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        timeout: 5000,
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('getFlag', () => {
    it('should return true for enabled SWITCH flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      const result = await client.getFlag('feature_checkout');
      expect(result).toBe(true);
    });

    it('should return false for disabled SWITCH flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'false',
      });

      const result = await client.getFlag('feature_disabled');
      expect(result).toBe(false);
    });

    it('should return number for INTEGER flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '100',
      });

      const result = await client.getFlag('max_items');
      expect(result).toBe(100);
      expect(typeof result).toBe('number');
    });

    it('should return number for FLOAT flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '3.14',
      });

      const result = await client.getFlag('price_multiplier');
      expect(result).toBe(3.14);
      expect(typeof result).toBe('number');
    });

    it('should return string for STRING flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '"welcome message"',
      });

      const result = await client.getFlag('welcome_message');
      expect(result).toBe('welcome message');
      expect(typeof result).toBe('string');
    });

    it('should return null for inactive flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'null',
      });

      const result = await client.getFlag('inactive_flag');
      expect(result).toBeNull();
    });

    it('should throw AuthenticationError on invalid API key', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(client.getFlag('test')).rejects.toThrow(AuthenticationError);
    });

    it('should throw InvalidFlagError when flag does not exist', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(client.getFlag('nonexistent')).rejects.toThrow(InvalidFlagError);
    });

    it('should throw NetworkError on network failure', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Connection refused'));

      await expect(client.getFlag('test')).rejects.toThrow(NetworkError);
    });

    it('should make request to correct endpoint', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      await client.getFlag('feature_test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/flag/production/feature_test',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
        })
      );
    });
  });

  describe('isEnabled', () => {
    it('should return true when flag value is true', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      const result = await client.isEnabled('feature_enabled');
      expect(result).toBe(true);
    });

    it('should return false when flag value is false', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'false',
      });

      const result = await client.isEnabled('feature_disabled');
      expect(result).toBe(false);
    });

    it('should return false when flag value is null', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'null',
      });

      const result = await client.isEnabled('inactive_flag');
      expect(result).toBe(false);
    });

    it('should return false for non-boolean values', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '100',
      });

      const result = await client.isEnabled('max_items');
      expect(result).toBe(false);
    });

    it('should throw errors from underlying getFlag call', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(client.isEnabled('test')).rejects.toThrow(AuthenticationError);
    });
  });

  describe('getEnvironment', () => {
    it('should return the current environment', () => {
      expect(client.getEnvironment()).toEqual(['production']);
    });

    it('should return array for single environment', () => {
      const singleClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: 'production',
      });
      expect(singleClient.getEnvironment()).toEqual(['production']);
    });

    it('should return array for multiple environments', () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
      });
      expect(multiClient.getEnvironment()).toEqual(['staging', 'development']);
    });
  });

  describe('withEnvironment', () => {
    it('should create a new client with different environment', () => {
      const stagingClient = client.withEnvironment('staging');

      expect(stagingClient).not.toBe(client);
      expect(stagingClient.getEnvironment()).toEqual(['staging']);
      expect(client.getEnvironment()).toEqual(['production']);
    });

    it('should accept array of environments', () => {
      const multiClient = client.withEnvironment(['staging', 'dev']);

      expect(multiClient).not.toBe(client);
      expect(multiClient.getEnvironment()).toEqual(['staging', 'dev']);
      expect(client.getEnvironment()).toEqual(['production']);
    });

    it('should preserve base URL and API key', async () => {
      const stagingClient = client.withEnvironment('staging');

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      await stagingClient.getFlag('test');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/flag/staging/test',
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
        })
      );
    });

    it('should preserve timeout setting', () => {
      const customClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: 'production',
        timeout: 5000,
      });

      const newClient = customClient.withEnvironment('staging');
      expect(newClient).toBeDefined();
    });
  });

  describe('subdirectory installation', () => {
    it('should handle base URL with subdirectory', async () => {
      const subdirClient = new PhlagClient({
        baseUrl: 'https://example.com/phlag',
        apiKey,
        environment,
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      await subdirClient.getFlag('test');

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/phlag/flag/production/test',
        expect.any(Object)
      );
    });

    it('should handle base URL with trailing slash', async () => {
      const subdirClient = new PhlagClient({
        baseUrl: 'https://example.com/phlag/',
        apiKey,
        environment,
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      await subdirClient.getFlag('test');

      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/phlag/flag/production/test',
        expect.any(Object)
      );
    });
  });

  describe('multi-environment fallback (without caching)', () => {
    it('should query multiple environments in parallel', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: false,
      });

      // Both environments return null, but fetch should be called for both
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'null',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'null',
        });

      const result = await multiClient.getFlag('test_flag');

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/flag/staging/test_flag',
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/flag/development/test_flag',
        expect.any(Object)
      );
    });

    it('should return first non-null value', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development', 'production'],
        cache: false,
      });

      // First returns null, second returns true, third returns false
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'null',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'true',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'false',
        });

      const result = await multiClient.getFlag('test_flag');

      // Should return true from development (second env)
      // All environments are fetched in parallel, but first non-null wins
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should NOT fallback on false (only null triggers fallback)', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: false,
      });

      // First returns false, second returns true
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'false',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'true',
        });

      const result = await multiClient.getFlag('test_flag');

      // Should return false (not fallback to development)
      expect(result).toBe(false);
    });

    it('should NOT fallback on 0 (only null triggers fallback)', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: false,
      });

      // First returns 0, second returns 100
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '0',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '100',
        });

      const result = await multiClient.getFlag('test_flag');

      // Should return 0 (not fallback to development)
      expect(result).toBe(0);
    });

    it('should NOT fallback on empty string (only null triggers fallback)', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: false,
      });

      // First returns empty string, second returns "value"
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '""',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '"value"',
        });

      const result = await multiClient.getFlag('test_flag');

      // Should return empty string (not fallback to development)
      expect(result).toBe('');
    });

    it('should return null when all environments return null', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development', 'production'],
        cache: false,
      });

      // All return null
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'null',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'null',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'null',
        });

      const result = await multiClient.getFlag('test_flag');

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should propagate errors from any environment', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: false,
      });

      // First returns null, second errors
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'null',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => 'Unauthorized',
        });

      await expect(multiClient.getFlag('test_flag')).rejects.toThrow();
    });
  });
});
