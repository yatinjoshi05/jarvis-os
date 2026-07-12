import { BaseError } from '../errors/BaseError';

/**
 * Thrown when an API request fails due to a network error.
 */
export class ApiNetworkError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
