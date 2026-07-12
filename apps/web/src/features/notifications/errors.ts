import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when notification transports fail to connect.
 */
export class NotificationDeliveryFailedError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
