import { BaseError } from '../errors/BaseError';

/**
 * Thrown when a provider fails to initialize its context state.
 */
export class ProviderInitializationError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
