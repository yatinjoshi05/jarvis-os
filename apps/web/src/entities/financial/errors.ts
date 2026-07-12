import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when ledger hash validations detect corruption.
 */
export class LedgerVerificationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
