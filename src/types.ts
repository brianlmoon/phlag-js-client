/**
 * Type for flag values returned by the Phlag API
 *
 * - SWITCH flags return boolean
 * - INTEGER flags return number or null
 * - FLOAT flags return number or null
 * - STRING flags return string or null
 */
export type FlagValue = boolean | number | string | null;

/**
 * Flag types supported by Phlag
 */
export type FlagType = 'SWITCH' | 'INTEGER' | 'FLOAT' | 'STRING';

/**
 * All flags response from the API (key-value pairs)
 */
export type FlagCache = Record<string, FlagValue>;

/**
 * Options for creating a PhlagClient instance
 */
export interface PhlagClientOptions {
  /**
   * Base URL of the Phlag server (e.g., http://localhost:8000)
   */
  baseUrl: string;

  /**
   * 64-character API key for authentication
   */
  apiKey: string;

  /**
   * Environment name to query (e.g., production, staging, development)
   */
  environment: string;

  /**
   * Request timeout in milliseconds (default: 10000)
   */
  timeout?: number;

  /**
   * Enable caching (default: false)
   */
  cache?: boolean;

  /**
   * Custom cache file path (Node.js only, default: auto-generated in temp dir)
   */
  cacheFile?: string;

  /**
   * Cache time-to-live in seconds (default: 300)
   */
  cacheTtl?: number;
}
