import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when lead transitions attempt invalid path jumps.
 */
export class LeadInvalidStatusTransitionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
