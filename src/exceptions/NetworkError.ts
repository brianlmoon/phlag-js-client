import { PhlagError } from './PhlagError.js';

/**
 * Thrown when network communication fails
 *
 * This covers connection timeouts, DNS failures, and other network-level
 * issues. The underlying error details are included in the message.
 */
export class NetworkError extends PhlagError {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
