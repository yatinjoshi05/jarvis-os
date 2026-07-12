import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when contact record is missing from directories.
 */
export class CrmContactNotFoundError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
