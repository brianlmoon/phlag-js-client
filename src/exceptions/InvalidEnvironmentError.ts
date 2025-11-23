import { PhlagError } from './PhlagError.js';

/**
 * Thrown when the specified environment doesn't exist
 *
 * This means the environment name you're querying isn't configured in the
 * Phlag system. Check the environment name spelling and that it exists
 * in your Phlag admin.
 */
export class InvalidEnvironmentError extends PhlagError {
  constructor(message: string) {
    super(message, 404);
    this.name = 'InvalidEnvironmentError';
    Object.setPrototypeOf(this, InvalidEnvironmentError.prototype);
  }
}
