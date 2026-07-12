import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when terminal commands execution pipelines crash.
 */
export class TerminalCommandExecutionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
