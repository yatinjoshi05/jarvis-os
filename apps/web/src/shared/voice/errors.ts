import { BaseError } from '../errors/BaseError';

/**
 * Thrown when the microphone device is blocked or unavailable.
 */
export class MicrophoneAccessError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
