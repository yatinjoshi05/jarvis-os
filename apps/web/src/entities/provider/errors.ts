import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when provider engines fail connection ping requests.
 */
export class ProviderUnavailableError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
