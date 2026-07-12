import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when visualization engine components fail.
 */
export class GraphWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
