import { BaseError } from '../errors/BaseError';

/**
 * Thrown when a service fails to boot up within timeout limits.
 */
export class ServiceTimeoutError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
