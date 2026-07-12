import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when terminal console emulator layouts fail to parse.
 */
export class TerminalWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
