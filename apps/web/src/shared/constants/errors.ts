import { BaseError } from '../errors/BaseError';

/**
 * Thrown when an invalid constant key is referenced.
 */
export class ConstantNotFoundError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
