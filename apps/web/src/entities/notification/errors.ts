import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when notification data mutations violate status boundaries.
 */
export class NotificationEntityStateError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
