import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when asset references are missing from user directories.
 */
export class PortfolioAssetNotFoundError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
