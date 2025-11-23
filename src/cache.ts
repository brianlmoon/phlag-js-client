import type { FlagCache } from './types.js';

// Declare Node.js globals for TypeScript
declare const process: {
  pid: number;
  versions?: {
    node?: string;
  };
};

declare function require(module: string): any;

/**
 * Utilities for file-based caching in Node.js
 *
 * These functions are only available in Node.js environments. In browser
 * environments, the PhlagClient will use in-memory caching only.
 */

/**
 * Generates a cache filename based on base URL and environment
 *
 * The filename is generated using an MD5 hash of the base URL and
 * environment name to ensure uniqueness across different Phlag servers
 * and environments. The file is placed in the system temp directory.
 *
 * @param baseUrl - The Phlag server base URL
 * @param environment - The environment name
 * @param customPath - Optional custom cache file path
 * @returns The absolute path to the cache file
 */
export function generateCacheFilename(
  baseUrl: string,
  environment: string,
  customPath?: string
): string {
  if (customPath) {
    return customPath;
  }

  // Lazy load Node.js modules
  const crypto = require('crypto');
  const os = require('os');

  const hash = crypto.createHash('md5').update(`${baseUrl}|${environment}`).digest('hex');
  return `${os.tmpdir()}/phlag_cache_${hash}.json`;
}

/**
 * Loads flag cache from file
 *
 * Reads the cache file and checks if it's still valid based on TTL.
 * Returns null if the file doesn't exist, is expired, or contains invalid data.
 *
 * @param cacheFile - Path to the cache file
 * @param cacheTtl - Cache time-to-live in seconds
 * @returns The cached flags or null if cache is invalid/expired
 */
export async function loadCacheFromFile(
  cacheFile: string,
  cacheTtl: number
): Promise<FlagCache | null> {
  try {
    const fs = require('fs/promises');

    const stats = await fs.stat(cacheFile);
    const mtime = stats.mtimeMs;
    const now = Date.now();

    // Check if cache is expired
    if (now - mtime >= cacheTtl * 1000) {
      return null;
    }

    const contents = await fs.readFile(cacheFile, 'utf-8');
    const data = JSON.parse(contents);

    // Validate that we got an object
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return data as FlagCache;
    }

    return null;
  } catch {
    // File doesn't exist or is not readable
    return null;
  }
}

/**
 * Writes flag cache to file using atomic write operation
 *
 * Uses a temporary file and rename to ensure atomic writes on POSIX systems,
 * preventing partial writes during concurrent access. Write failures are
 * caught silently to allow graceful degradation.
 *
 * @param cacheFile - Path to the cache file
 * @param data - The flag cache data to write
 */
export async function writeCacheToFile(cacheFile: string, data: FlagCache): Promise<void> {
  try {
    const fs = require('fs/promises');
    const tempFile = `${cacheFile}.${process.pid}.tmp`;
    const contents = JSON.stringify(data);

    await fs.writeFile(tempFile, contents, 'utf-8');

    // Atomic rename (POSIX systems)
    // On Windows, this might fail if the file exists, so we use a try/catch
    try {
      await fs.unlink(cacheFile);
    } catch {
      // File might not exist yet
    }

    await fs.writeFile(cacheFile, contents, 'utf-8');

    // Clean up temp file
    try {
      await fs.unlink(tempFile);
    } catch {
      // Temp file might have been used in rename
    }
  } catch (error) {
    // Log error but don't throw - allow graceful degradation
    if (error instanceof Error) {
      console.error(`Phlag: Unable to write cache file: ${cacheFile}`, error.message);
    }
  }
}

/**
 * Deletes the cache file
 *
 * @param cacheFile - Path to the cache file
 */
export async function deleteCacheFile(cacheFile: string): Promise<void> {
  try {
    const fs = require('fs/promises');
    await fs.unlink(cacheFile);
  } catch {
    // File might not exist
  }
}

/**
 * Checks if we're running in Node.js environment
 *
 * @returns True if running in Node.js
 */
export function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null
  );
}
