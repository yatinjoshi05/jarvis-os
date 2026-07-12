import { BaseError } from '../errors/BaseError';

/**
 * Thrown when configuration loading fails.
 */
export class ConfigLoadError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
