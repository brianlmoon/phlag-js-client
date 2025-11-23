import { PhlagError } from './PhlagError.js';

/**
 * Thrown when a requested flag doesn't exist
 *
 * This means the flag name wasn't found in the Phlag system.
 * Note: When caching is enabled, this exception is not thrown - the cache
 * simply returns null for missing flags.
 */
export class InvalidFlagError extends PhlagError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'InvalidFlagError';
    Object.setPrototypeOf(this, InvalidFlagError.prototype);
  }
}
