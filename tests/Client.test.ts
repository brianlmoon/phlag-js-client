import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from '../src/Client.js';
import {
  AuthenticationError,
  InvalidFlagError,
  InvalidEnvironmentError,
  NetworkError,
  PhlagError,
} from '../src/exceptions/index.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Client', () => {
  let client: Client;
  const baseUrl = 'http://localhost:8000';
  const apiKey = 'test-api-key-64-chars-long-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  beforeEach(() => {
    client = new Client(baseUrl, apiKey, 1000);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should strip trailing slash from base URL', () => {
      const clientWithSlash = new Client('http://localhost:8000/', apiKey);
      expect(clientWithSlash).toBeDefined();
    });

    it('should accept base URL without trailing slash', () => {
      const clientWithoutSlash = new Client('http://localhost:8000', apiKey);
      expect(clientWithoutSlash).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return boolean true for enabled SWITCH flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      const result = await client.get('flag/production/feature_checkout');
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/flag/production/feature_checkout',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
        })
      );
    });

    it('should return boolean false for disabled SWITCH flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'false',
      });

      const result = await client.get('flag/production/feature_disabled');
      expect(result).toBe(false);
    });

    it('should return number for INTEGER flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '100',
      });

      const result = await client.get('flag/production/max_items');
      expect(result).toBe(100);
    });

    it('should return number for FLOAT flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '3.14',
      });

      const result = await client.get('flag/production/price_multiplier');
      expect(result).toBe(3.14);
    });

    it('should return string for STRING flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '"welcome message"',
      });

      const result = await client.get('flag/production/welcome_message');
      expect(result).toBe('welcome message');
    });

    it('should return null for inactive flag', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'null',
      });

      const result = await client.get('flag/production/inactive_flag');
      expect(result).toBeNull();
    });

    it('should return null for empty response', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const result = await client.get('flag/production/empty');
      expect(result).toBeNull();
    });

    it('should throw AuthenticationError on 401', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(client.get('flag/production/test')).rejects.toThrow(AuthenticationError);
    });

    it('should throw InvalidFlagError on 404 for flag endpoint', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(client.get('flag/production/nonexistent')).rejects.toThrow(InvalidFlagError);
    });

    it('should throw InvalidEnvironmentError on 404 for environment endpoint', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      await expect(client.get('all-flags/nonexistent')).rejects.toThrow(InvalidEnvironmentError);
    });

    it('should throw PhlagError on 500', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(client.get('flag/production/test')).rejects.toThrow(PhlagError);
    });

    it('should throw NetworkError on timeout', async () => {
      (fetch as any).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      await expect(client.get('flag/production/test')).rejects.toThrow(NetworkError);
    });

    it('should throw NetworkError on network failure', async () => {
      (fetch as any).mockRejectedValue(new Error('Connection refused'));

      await expect(client.get('flag/production/test')).rejects.toThrow(NetworkError);
    });

    it('should handle subdirectory base URLs correctly', async () => {
      const subdirClient = new Client('http://example.com/phlag', apiKey);

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'true',
      });

      await subdirClient.get('flag/production/test');

      expect(fetch).toHaveBeenCalledWith(
        'http://example.com/phlag/flag/production/test',
        expect.any(Object)
      );
    });
  });
});
