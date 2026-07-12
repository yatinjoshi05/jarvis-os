import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when top header views fail to mount.
 */
export class HeaderWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
