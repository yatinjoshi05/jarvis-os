import { BaseError } from '../errors/BaseError';

/**
 * Thrown when store state mutation violates validation constraints.
 */
export class StoreMutationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
