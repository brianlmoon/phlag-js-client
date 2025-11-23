/**
 * Base exception class for all Phlag client errors
 *
 * This is the parent class for all exceptions thrown by the Phlag client.
 * You can catch this to handle any Phlag-related error, or catch specific
 * subclasses for more granular error handling.
 */
export class PhlagError extends Error {
  constructor(
    message: string,
    public readonly code?: number
  ) {
    super(message);
    this.name = 'PhlagError';
    Object.setPrototypeOf(this, PhlagError.prototype);
  }
}
