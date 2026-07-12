import { BaseError } from '../../shared/errors/BaseError';

/**
 * Thrown when voice waveform rendering fails.
 */
export class VoiceWidgetRenderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
