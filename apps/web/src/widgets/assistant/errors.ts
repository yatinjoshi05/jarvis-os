import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when assistant UI rendering pipeline fails.
 */
export class AssistantWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
