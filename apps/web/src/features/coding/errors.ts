import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when compiler pipelines crash or fail validations.
 */
export class CodeCompilationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
