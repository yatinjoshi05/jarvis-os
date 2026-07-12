import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when automation action execution block fails.
 */
export class AutomationExecutionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
