import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when local settings storage writes fail.
 */
export class SettingsSaveError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
