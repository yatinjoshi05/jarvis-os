import { BaseError } from '../errors/BaseError';

/**
 * Thrown when the authentication token has expired.
 */
export class AuthTokenExpiredError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
