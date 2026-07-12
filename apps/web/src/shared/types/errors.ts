import { BaseError } from '../errors/BaseError';

/**
 * Thrown when runtime data fails schema parsing validation.
 */
export class SchemaValidationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
