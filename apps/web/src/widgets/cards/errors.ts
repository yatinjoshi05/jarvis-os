import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when summary cards rendering pipeline encounters errors.
 */
export class CardWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
