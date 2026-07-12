import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when dashboard rendering pipelines fail.
 */
export class DashboardWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
