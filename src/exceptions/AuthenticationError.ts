import { PhlagError } from './PhlagError.js';

/**
 * Thrown when API authentication fails
 *
 * This typically means the API key is invalid or has been revoked.
 * Check that you're using the correct 64-character key from the Phlag admin.
 */
export class AuthenticationError extends PhlagError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
