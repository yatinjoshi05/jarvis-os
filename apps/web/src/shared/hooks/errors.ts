import { BaseError } from '../errors/BaseError';

/**
 * Thrown when a hook is executed outside its required context provider.
 */
export class HookContextError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
