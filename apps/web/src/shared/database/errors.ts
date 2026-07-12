import { BaseError } from '../errors/BaseError';

/**
 * Thrown when a connection to the database cannot be established.
 */
export class DatabaseConnectionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
