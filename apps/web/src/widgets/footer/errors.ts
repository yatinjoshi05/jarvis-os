import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when bottom footer components fail to render.
 */
export class FooterWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
