import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when target conversation cannot be retrieved from indexing database.
 */
export class ConversationNotFoundError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
