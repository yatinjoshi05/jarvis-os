import { BaseError } from '../errors/BaseError';

/**
 * Thrown when an operations utility utility execution fails.
 */
export class UtilityExecutionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
