import { BaseError } from '../errors/BaseError';

/**
 * Thrown when memory limit capacity is exceeded.
 */
export class MemoryOverflowError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
