import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when message deserialization detects corrupted file structures.
 */
export class MessageCorruptedError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
