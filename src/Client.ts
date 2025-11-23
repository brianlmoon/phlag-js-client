import {
  PhlagError,
  AuthenticationError,
  InvalidFlagError,
  InvalidEnvironmentError,
  NetworkError,
} from './exceptions/index.js';
import type { FlagValue, FlagCache } from './types.js';

/**
 * HTTP client wrapper for communicating with the Phlag API
 *
 * This class wraps the fetch API and handles authentication, error handling,
 * and response parsing. It's used internally by PhlagClient and shouldn't be
 * used directly by application code.
 */
export class Client {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  /**
   * Creates a new HTTP client for the Phlag API
   *
   * The base URL is normalized by removing any trailing slash for storage,
   * but adding it back when making requests. This ensures proper URI resolution
   * when the base URL includes a subdirectory path.
   *
   * @param baseUrl - The base URL of the Phlag server (e.g., http://localhost:8000)
   * @param apiKey - The 64-character API key for authentication
   * @param timeout - Request timeout in milliseconds (default: 10000)
   */
  constructor(baseUrl: string, apiKey: string, timeout: number = 10000) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Sends a GET request to the Phlag API
   *
   * This method handles authentication, error handling, and JSON parsing.
   * It throws specific exceptions for different error conditions to make
   * error handling easier for calling code.
   *
   * The endpoint should be a relative path (without leading slash) to properly
   * work with base URLs that include subdirectories.
   *
   * @param endpoint - The API endpoint path (e.g., flag/production/feature_name)
   * @returns The decoded JSON response
   * @throws {AuthenticationError} When the API key is invalid (401)
   * @throws {InvalidFlagError} When a flag doesn't exist (404 on /flag endpoint)
   * @throws {InvalidEnvironmentError} When an environment doesn't exist (404)
   * @throws {NetworkError} When network communication fails
   * @throws {PhlagError} For other HTTP errors
   */
  async get(endpoint: string): Promise<FlagValue>;
  async get(endpoint: string, returnObject: true): Promise<FlagCache>;
  async get(endpoint: string, returnObject = false): Promise<FlagValue | FlagCache> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}/${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response, endpoint);
      }

      const text = await response.text();

      // Handle empty responses
      if (!text) {
        return null;
      }

      try {
        const parsed = JSON.parse(text);
        // If we expect an object (all-flags endpoint), ensure we return an object
        if (
          returnObject &&
          typeof parsed === 'object' &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return parsed as FlagCache;
        }
        return parsed as FlagValue;
      } catch {
        // If JSON parsing fails, return the text as-is
        return text;
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw our custom errors
      if (error instanceof PhlagError) {
        throw error;
      }

      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError(`Request timeout after ${this.timeout}ms`);
      }

      // Handle other network errors
      if (error instanceof Error) {
        throw new NetworkError(`Network error: ${error.message}`, error);
      }

      throw new NetworkError('Unknown network error');
    }
  }

  /**
   * Handles HTTP error responses by throwing appropriate exceptions
   *
   * @param response - The failed HTTP response
   * @param endpoint - The endpoint that was requested
   * @throws {AuthenticationError} For 401 responses
   * @throws {InvalidFlagError} For 404 responses on flag endpoints
   * @throws {InvalidEnvironmentError} For 404 responses on environment endpoints
   * @throws {PhlagError} For all other error responses
   */
  private async handleErrorResponse(response: Response, endpoint: string): Promise<never> {
    const statusCode = response.status;

    if (statusCode === 401) {
      throw new AuthenticationError('Invalid API key');
    }

    if (statusCode === 404) {
      if (endpoint.startsWith('flag/')) {
        throw new InvalidFlagError(`Flag not found: ${endpoint}`);
      }
      throw new InvalidEnvironmentError(`Environment not found: ${endpoint}`);
    }

    let errorMessage = `HTTP error ${statusCode}`;
    try {
      const text = await response.text();
      if (text) {
        errorMessage += `: ${text}`;
      }
    } catch {
      // Ignore errors reading response body
    }

    throw new PhlagError(errorMessage, statusCode);
  }
}
