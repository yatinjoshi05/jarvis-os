import { BaseError } from '../errors/BaseError';

/**
 * Thrown when logging stream initialization fails.
 */
export class LoggerInitError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
