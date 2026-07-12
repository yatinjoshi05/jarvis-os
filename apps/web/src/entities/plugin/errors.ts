import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when plugins fail API compatibility checks.
 */
export class PluginIncompatibleError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
