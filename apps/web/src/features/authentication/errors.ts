import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when credentials fail validation checks.
 */
export class AuthInvalidCredentialsError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
