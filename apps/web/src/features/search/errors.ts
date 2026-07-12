import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when search syntax fails parsing rules.
 */
export class SearchQuerySyntaxError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
