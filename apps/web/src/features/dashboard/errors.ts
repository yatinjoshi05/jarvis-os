import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when grid layout positioning parameters violate bounds.
 */
export class DashboardLayoutError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
