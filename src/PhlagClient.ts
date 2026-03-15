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
  private readonly environments: string[];
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly cacheEnabled: boolean;
  private readonly cacheFile: string;
  private readonly cacheTtl: number;
  private readonly useFileCache: boolean;
  private flagCache: FlagCache | null = null;

  /**
   * Creates a new Phlag client for one or more environments
   *
   * Single environment:
   * ```typescript
   * new PhlagClient({ environment: 'production', ... })
   * ```
   *
   * Multiple environments with fallback (for dev/QA):
   * ```typescript
   * new PhlagClient({ environment: ['my-branch', 'staging'], ... })
   * ```
   *
   * When multiple environments are configured, flag queries will check each
   * environment in order until a non-null value is found. Only null triggers
   * fallback - false, 0, and empty string are valid values that stop the chain.
   *
   * When caching is enabled with multiple environments, the client fetches all
   * flags from each environment in parallel and merges them, with earlier
   * environments taking precedence. Subsequent requests use the merged cache.
   *
   * @param options - Configuration options for the client
   */
  constructor(options: PhlagClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    
    // Normalize environment to array
    this.environments = Array.isArray(options.environment) 
      ? options.environment 
      : [options.environment];
    
    this.timeout = options.timeout ?? 10000;
    this.cacheEnabled = options.cache ?? false;
    this.cacheTtl = options.cacheTtl ?? 300;
    this.client = new Client(this.baseUrl, this.apiKey, this.timeout);

    // Check if we can use file-based caching (Node.js only)
    this.useFileCache = this.cacheEnabled && isNodeEnvironment();

    // Generate cache filename (environments order matters for fallback priority)
    this.cacheFile = generateCacheFilename(this.baseUrl, this.environments, options.cacheFile);
  }

  /**
   * Gets the value of a single feature flag
   *
   * This method retrieves the current value of a flag from the configured
   * environment(s). The return type depends on the flag type:
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
   * **Multi-environment fallback:**
   * When multiple environments are configured, the client queries each
   * environment in order until it finds a non-null value. Only null triggers
   * fallback - false, 0, and empty string are valid values that stop the chain.
   *
   * When caching is enabled, this method serves values from the in-memory
   * cache (populated on first request). When caching is disabled, each call
   * makes API requests to /flag/{environment}/{name}.
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
      // Use direct API calls with multi-environment fallback
      if (this.environments.length === 1) {
        // Single environment - direct call
        const endpoint = `flag/${this.environments[0]}/${name}`;
        return await this.client.get(endpoint);
      } else {
        // Multiple environments - fetch in parallel and apply fallback
        const promises = this.environments.map((env) => {
          const endpoint = `flag/${env}/${name}`;
          return this.client.get(endpoint).catch((error) => {
            // If any environment errors, let it bubble up
            throw error;
          });
        });

        const results = await Promise.all(promises);

        // Return first non-null value
        for (const value of results) {
          if (value !== null) {
            return value;
          }
        }

        return null;
      }
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
   * Gets the current environment name(s)
   *
   * Always returns an array, even for single environment configuration.
   * This is a breaking change from v1.x which returned a string.
   *
   * @returns Array of environment names
   *
   * @example
   * ```typescript
   * const client = new PhlagClient({ environment: 'production', ... });
   * client.getEnvironment(); // ['production']
   *
   * const multi = new PhlagClient({ environment: ['staging', 'dev'], ... });
   * multi.getEnvironment(); // ['staging', 'dev']
   * ```
   */
  getEnvironment(): string[] {
    return this.environments;
  }

  /**
   * Creates a new client instance with different environment(s)
   *
   * This method returns a new PhlagClient instance configured for different
   * environment(s) while reusing the same base URL and API key. This is useful
   * when you need to query multiple environments without maintaining multiple
   * client instances.
   *
   * The original client instance is not modified (immutable pattern). Cache
   * settings are preserved, but a new cache file is generated for the new
   * environment(s) to prevent cache collisions.
   *
   * @param environments - Single environment or array of environments
   * @returns A new PhlagClient instance for the specified environment(s)
   *
   * @example
   * ```typescript
   * const prod = new PhlagClient({ environment: 'production', ... });
   * const staging = prod.withEnvironment('staging');
   * const multi = prod.withEnvironment(['my-branch', 'staging']);
   * ```
   */
  withEnvironment(environments: string | string[]): PhlagClient {
    return new PhlagClient({
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      environment: environments,
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
   * **Multi-environment behavior:**
   * When multiple environments are configured, fetches all flags from each
   * environment in parallel and merges them. Earlier environments in the
   * array take precedence for conflicting flag names.
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
    if (this.environments.length === 1) {
      // Single environment - direct fetch
      const endpoint = `all-flags/${this.environments[0]}`;
      this.flagCache = await this.client.get(endpoint, true);
    } else {
      // Multiple environments - fetch in parallel and merge
      const promises = this.environments.map((env) => {
        const endpoint = `all-flags/${env}`;
        return this.client.get(endpoint, true);
      });

      const results = await Promise.all(promises);

      // Merge results: first environment takes precedence
      // Start with empty object, then assign from last to first
      // so first environment's values overwrite later ones
      this.flagCache = {};
      for (let i = results.length - 1; i >= 0; i--) {
        Object.assign(this.flagCache, results[i]);
      }
    }

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
