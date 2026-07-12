import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when target actions violate security permissions.
 */
export class UserPermissionDeniedError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
