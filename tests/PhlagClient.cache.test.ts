import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PhlagClient } from '../src/PhlagClient.js';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';

// Mock fetch globally
global.fetch = vi.fn();

describe('PhlagClient with Caching', () => {
  const baseUrl = 'http://localhost:8000';
  const apiKey = 'test-api-key-64-chars-long-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const environment = 'production';
  let cacheFile: string;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up cache file if it exists
    if (cacheFile && existsSync(cacheFile)) {
      try {
        await unlink(cacheFile);
      } catch {
        // Ignore errors
      }
    }
    vi.restoreAllMocks();
  });

  describe('constructor with cache options', () => {
    it('should create client with caching enabled', () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      expect(client.isCacheEnabled()).toBe(true);
      expect(client.getCacheTtl()).toBe(300);
    });

    it('should create client with custom cache TTL', () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
        cacheTtl: 600,
      });

      expect(client.getCacheTtl()).toBe(600);
    });

    it('should create client with custom cache file', () => {
      const customPath = `${tmpdir()}/custom_cache.json`;
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
        cacheFile: customPath,
      });

      expect(client.getCacheFile()).toBe(customPath);
    });

    it('should generate auto cache filename', () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      const filename = client.getCacheFile();
      expect(filename).toContain('phlag_cache_');
      expect(filename).toContain('.json');
    });
  });

  describe('getFlag with caching', () => {
    it('should fetch all flags on first request', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client.getCacheFile();

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_one: true,
            feature_two: false,
            max_items: 100,
          }),
      });

      const result = await client.getFlag('feature_one');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${baseUrl}/all-flags/${environment}`, expect.any(Object));
    });

    it('should serve from cache on subsequent requests', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client.getCacheFile();

      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_one: true,
            feature_two: false,
            max_items: 100,
          }),
      });

      // First request - should fetch from API
      await client.getFlag('feature_one');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second request - should use cache
      const result2 = await client.getFlag('feature_two');
      expect(result2).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call

      // Third request - should use cache
      const result3 = await client.getFlag('max_items');
      expect(result3).toBe(100);
      expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should return null for missing flags when cached', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client.getCacheFile();

      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_one: true,
          }),
      });

      const result = await client.getFlag('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('warmCache', () => {
    it('should preload cache immediately', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client.getCacheFile();

      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_one: true,
          }),
      });

      await client.warmCache();

      expect(fetch).toHaveBeenCalledTimes(1);

      // Subsequent getFlag should not make API call
      await client.getFlag('feature_one');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should be no-op when caching disabled', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: false,
      });

      await client.warmCache();

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear in-memory cache', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client.getCacheFile();

      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_one: true,
          }),
      });

      // Load cache
      await client.getFlag('feature_one');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      await client.clearCache();

      // Next request should fetch again
      await client.getFlag('feature_one');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should be no-op when caching disabled', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: false,
      });

      await client.clearCache();

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('withEnvironment with caching', () => {
    it('should create new client with separate cache', async () => {
      const prodClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: 'production',
        cache: true,
      });

      cacheFile = prodClient.getCacheFile();

      const stagingClient = prodClient.withEnvironment('staging');

      expect(stagingClient.getEnvironment()).toEqual(['staging']);
      expect(stagingClient.isCacheEnabled()).toBe(true);
      expect(stagingClient.getCacheFile()).not.toBe(prodClient.getCacheFile());
    });
  });

  describe('isEnabled with caching', () => {
    it('should work with cached flags', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client.getCacheFile();

      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_enabled: true,
            feature_disabled: false,
          }),
      });

      const enabled = await client.isEnabled('feature_enabled');
      const disabled = await client.isEnabled('feature_disabled');

      expect(enabled).toBe(true);
      expect(disabled).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache persistence', () => {
    it('should write cache to file in Node.js', async () => {
      const client = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client.getCacheFile();

      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_one: true,
          }),
      });

      await client.getFlag('feature_one');

      // Give it a moment to write the file
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(existsSync(cacheFile)).toBe(true);
    });

    it('should load from file cache on second instance', async () => {
      const client1 = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      cacheFile = client1.getCacheFile();

      (fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            feature_one: true,
          }),
      });

      // First client loads from API
      await client1.getFlag('feature_one');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Wait for file to be written
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second client with same config should load from file
      const client2 = new PhlagClient({
        baseUrl,
        apiKey,
        environment,
        cache: true,
      });

      const result = await client2.getFlag('feature_one');

      // Should still be only 1 API call (from client1)
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('multi-environment caching', () => {
    it('should fetch all environments in parallel on first request', async () => {
      const testCacheFile = `${tmpdir()}/phlag_test_parallel_${Date.now()}.json`;
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: true,
        cacheFile: testCacheFile,
      });

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            feature_one: true,
            feature_two: 42,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            feature_three: 'value',
            feature_four: null,
          }),
        });

      const result = await multiClient.getFlag('feature_one');

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/all-flags/staging',
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/all-flags/development',
        expect.any(Object)
      );
      
      // Cleanup
      try {
        await unlink(testCacheFile);
      } catch {}
    });

    it('should merge caches with first environment taking precedence', async () => {
      const testCacheFile = `${tmpdir()}/phlag_test_merge_${Date.now()}.json`;
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: true,
        cacheFile: testCacheFile,
      });

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            shared_flag: 'staging-value',
            staging_only: true,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            shared_flag: 'dev-value',
            dev_only: 100,
          }),
        });

      const sharedFlag = await multiClient.getFlag('shared_flag');
      const stagingFlag = await multiClient.getFlag('staging_only');
      const devFlag = await multiClient.getFlag('dev_only');

      // First environment (staging) wins for conflicts
      expect(sharedFlag).toBe('staging-value');
      expect(stagingFlag).toBe(true);
      expect(devFlag).toBe(100);
      expect(fetch).toHaveBeenCalledTimes(2); // Only called once for initial load
      
      // Cleanup
      try {
        await unlink(testCacheFile);
      } catch {}
    });

    it('should use cached data for subsequent requests', async () => {
      const testCacheFile = `${tmpdir()}/phlag_test_cached_${Date.now()}.json`;
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: true,
        cacheFile: testCacheFile,
      });

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ flag1: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ flag2: false }),
        });

      await multiClient.getFlag('flag1');
      await multiClient.getFlag('flag2');
      await multiClient.getFlag('flag1');

      // Should only call API twice (once per environment during initial load)
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Cleanup
      try {
        await unlink(testCacheFile);
      } catch {}
    });

    it('should return null for missing flags in all environments', async () => {
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: true,
      });

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ existing_flag: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ another_flag: false }),
        });

      const result = await multiClient.getFlag('missing_flag');

      expect(result).toBeNull();
    });

    it('should generate different cache files for different environment orders', () => {
      const client1 = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: true,
      });

      const client2 = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['development', 'staging'],
        cache: true,
      });

      // Different order = different priority = different cache
      expect(client1.getCacheFile()).not.toBe(client2.getCacheFile());
    });

    it('should warm cache for all environments', async () => {
      const testCacheFile = `${tmpdir()}/phlag_test_warm_${Date.now()}.json`;
      const multiClient = new PhlagClient({
        baseUrl,
        apiKey,
        environment: ['staging', 'development'],
        cache: true,
        cacheFile: testCacheFile,
      });

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ flag1: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ flag2: false }),
        });

      await multiClient.warmCache();

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/all-flags/staging',
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/all-flags/development',
        expect.any(Object)
      );

      // Subsequent call should not hit API
      await multiClient.getFlag('flag1');
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Cleanup
      try {
        await unlink(testCacheFile);
      } catch {}
    });
  });
});
