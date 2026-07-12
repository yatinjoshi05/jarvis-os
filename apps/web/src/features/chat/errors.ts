import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when chat messaging fails delivery pipelines.
 */
export class ChatMessageDeliveryError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
