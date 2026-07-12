import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when budget accounts contain insufficient cash.
 */
export class FinancialInsufficentFundsError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
