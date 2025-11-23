import { Client } from './Client.js';
import type { FlagValue, PhlagClientOptions, FlagCache } from './types.js';
import {
  generateCacheFilename,
  loadCacheFromFile,
  writeCacheToFile,
  deleteCacheFile,
  isNodeEnvironment,
} from './cache.js';

/**
 * Primary client for interacting with the Phlag feature flag API
 *
 * This is the main entry point for the Phlag client library. It provides
 * methods for retrieving feature flag values from a specific environment.
 * The environment is set at construction time and all requests use that
 * environment.
 *
 * When caching is enabled, the client fetches all flags for the environment
 * once using the /all-flags endpoint and serves subsequent requests from
 * the cached data. This dramatically reduces API calls but means flag
 * changes won't be reflected until the cache expires (default 5 minutes).
 *
 * @example
 * ```typescript
 * const client = new PhlagClient({
 *   baseUrl: 'http://localhost:8000',
 *   apiKey: 'your-64-char-api-key',
 *   environment: 'production'
 * });
 *
 * // Check a boolean flag
 * if (await client.isEnabled('feature_checkout')) {
 *   // Feature is enabled
 * }
 *
 * // Get a typed value
 * const maxItems = await client.getFlag('max_items'); // returns number or null
 * ```
 *
 * @example With caching
 * ```typescript
 * const client = new PhlagClient({
 *   baseUrl: 'http://localhost:8000',
 *   apiKey: 'your-api-key',
 *   environment: 'production',
 *   cache: true,      // Enable caching
 *   cacheTtl: 300,    // Cache for 5 minutes
 * });
 * ```
 */
export class PhlagClient {
  private readonly client: Client;
  private readonly environment: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly cacheEnabled: boolean;
  private readonly cacheFile: string;
  private readonly cacheTtl: number;
  private readonly useFileCache: boolean;
  private flagCache: FlagCache | null = null;

  /**
   * Creates a new Phlag client for a specific environment
   *
   * The environment is set at construction time and all flag requests will
   * use this environment. To query a different environment, create a new
   * instance or use the withEnvironment() method.
   *
   * When caching is enabled, the client fetches all flags for the environment
   * once using the /all-flags endpoint and serves subsequent requests from
   * the cached data. In Node.js environments, the cache is also persisted to
   * disk for cross-request persistence.
   *
   * @param options - Configuration options for the client
   */
  constructor(options: PhlagClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.environment = options.environment;
    this.timeout = options.timeout ?? 10000;
    this.cacheEnabled = options.cache ?? false;
    this.cacheTtl = options.cacheTtl ?? 300;
    this.client = new Client(this.baseUrl, this.apiKey, this.timeout);

    // Check if we can use file-based caching (Node.js only)
    this.useFileCache = this.cacheEnabled && isNodeEnvironment();

    // Generate cache filename
    this.cacheFile = generateCacheFilename(this.baseUrl, this.environment, options.cacheFile);
  }

  /**
   * Gets the value of a single feature flag
   *
   * This method retrieves the current value of a flag from the configured
   * environment. The return type depends on the flag type:
   *
   * - SWITCH flags return boolean (true/false)
   * - INTEGER flags return number or null
   * - FLOAT flags return number or null
   * - STRING flags return string or null
   *
   * Flags return null when they don't exist, aren't configured for the
   * environment, or are outside their temporal constraints (for non-SWITCH
   * types). SWITCH flags return false when inactive.
   *
   * When caching is enabled, this method serves values from the in-memory
   * cache (populated on first request). When caching is disabled, each call
   * makes a direct API request to /flag/{environment}/{name}.
   *
   * @param name - The flag name
   * @returns The flag value (boolean, number, string, or null)
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {InvalidFlagError} When the flag doesn't exist (cache disabled only)
   * @throws {InvalidEnvironmentError} When the environment doesn't exist
   * @throws {NetworkError} When network communication fails
   * @throws {PhlagError} For other errors
   */
  async getFlag(name: string): Promise<FlagValue> {
    if (this.cacheEnabled) {
      // Lazy load cache on first request
      if (this.flagCache === null) {
        await this.loadCache();
      }

      return this.flagCache![name] ?? null;
    } else {
      // Use direct API call
      const endpoint = `flag/${this.environment}/${name}`;
      return await this.client.get(endpoint);
    }
  }

  /**
   * Checks if a SWITCH flag is enabled
   *
   * This is a convenience method for checking boolean flags. It's equivalent
   * to calling getFlag() and checking for true, but provides a more readable
   * API for the common case of feature toggles.
   *
   * Note: This only makes sense for SWITCH type flags. Using it with other
   * flag types will return false for any non-true value.
   *
   * @param name - The flag name
   * @returns True if the flag is enabled, false otherwise
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {InvalidEnvironmentError} When the environment doesn't exist
   * @throws {NetworkError} When network communication fails
   * @throws {PhlagError} For other errors
   */
  async isEnabled(name: string): Promise<boolean> {
    const value = await this.getFlag(name);
    return value === true;
  }

  /**
   * Gets the current environment name
   *
   * @returns The environment name
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * Creates a new client instance with a different environment
   *
   * This method returns a new PhlagClient instance configured for a different
   * environment while reusing the same base URL and API key. This is useful
   * when you need to query multiple environments without maintaining multiple
   * client instances.
   *
   * The original client instance is not modified (immutable pattern). Cache
   * settings are preserved, but a new cache file is generated for the new
   * environment to prevent cache collisions.
   *
   * @param environment - The new environment name
   * @returns A new PhlagClient instance for the specified environment
   */
  withEnvironment(environment: string): PhlagClient {
    return new PhlagClient({
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      environment,
      timeout: this.timeout,
      cache: this.cacheEnabled,
      cacheTtl: this.cacheTtl,
      // Let new instance generate its own cache file
    });
  }

  /**
   * Loads flag cache from file or API
   *
   * This method first checks if a valid cache file exists (Node.js only).
   * If the file exists and hasn't expired, it loads the cached data.
   * Otherwise, it fetches all flags from the API using the /all-flags
   * endpoint and writes the cache file.
   *
   * Cache file write failures are logged but don't throw exceptions,
   * allowing graceful degradation to in-memory-only caching.
   */
  private async loadCache(): Promise<void> {
    // Try to load from file cache (Node.js only)
    if (this.useFileCache) {
      const cached = await loadCacheFromFile(this.cacheFile, this.cacheTtl);
      if (cached !== null) {
        this.flagCache = cached;
        return;
      }
    }

    // Cache miss or expired - fetch from API
    const endpoint = `all-flags/${this.environment}`;
    this.flagCache = await this.client.get(endpoint, true);

    // Write to cache file (Node.js only)
    if (this.useFileCache && this.flagCache) {
      await writeCacheToFile(this.cacheFile, this.flagCache);
    }
  }

  /**
   * Preloads the flag cache without waiting for first request
   *
   * This method immediately fetches all flags from the API and populates
   * the cache, rather than waiting for the first getFlag() call. Useful
   * for warming the cache during application startup or deployment.
   *
   * Note: This method is a no-op if caching is disabled.
   *
   * @throws {AuthenticationError} When the API key is invalid
   * @throws {InvalidEnvironmentError} When the environment doesn't exist
   * @throws {NetworkError} When network communication fails
   * @throws {PhlagError} For other API errors
   */
  async warmCache(): Promise<void> {
    if (this.cacheEnabled) {
      await this.loadCache();
    }
  }

  /**
   * Clears the in-memory and file cache
   *
   * This forces a fresh fetch on the next flag request. Useful when you
   * know flags have been updated on the server and you want an immediate
   * refresh without waiting for TTL expiration.
   *
   * Note: This method is a no-op if caching is disabled.
   */
  async clearCache(): Promise<void> {
    if (this.cacheEnabled) {
      this.flagCache = null;

      if (this.useFileCache) {
        await deleteCacheFile(this.cacheFile);
      }
    }
  }

  /**
   * Checks if caching is enabled
   *
   * @returns True if caching is enabled
   */
  isCacheEnabled(): boolean {
    return this.cacheEnabled;
  }

  /**
   * Gets the cache file path
   *
   * This returns the path even if the file doesn't exist yet. The file
   * will be created on the first cache load when caching is enabled.
   *
   * @returns The absolute path to the cache file
   */
  getCacheFile(): string {
    return this.cacheFile;
  }

  /**
   * Gets the cache TTL in seconds
   *
   * @returns The cache time-to-live in seconds
   */
  getCacheTtl(): number {
    return this.cacheTtl;
  }
}
