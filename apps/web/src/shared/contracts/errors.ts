import { BaseError } from '../errors/BaseError';

/**
 * Thrown when a contract validation fails.
 */
export class ContractValidationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
