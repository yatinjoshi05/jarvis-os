import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when web browser engine navigation fails.
 */
export class BrowserNavigationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
