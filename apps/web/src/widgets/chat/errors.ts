import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when conversational panels rendering fails.
 */
export class ChatWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
