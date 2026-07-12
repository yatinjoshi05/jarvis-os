import { BaseError } from '../errors/BaseError';

/**
 * Thrown when an event fails to dispatch correctly to subscribers.
 */
export class EventDispatchError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
