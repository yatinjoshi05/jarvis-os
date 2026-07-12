import { BaseError } from '../errors/BaseError';

export class AIError extends BaseError {
  public readonly status?: number;
  public readonly providerName: string;

  constructor(providerName: string, message: string, status?: number, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'AIError';
    this.providerName = providerName;
    this.status = status;
  }
}

export class ErrorManager {
  public static createError(providerName: string, message: string, status?: number): AIError {
    return new AIError(providerName, message, status);
  }

  public static mapProviderError(providerName: string, error: any): AIError {
    if (error instanceof AIError) return error;

    const message = error?.message || String(error);
    const status = error?.status || error?.statusCode || undefined;

    let userMessage = 'An unexpected error occurred in the AI system.';

    if (status === 401 || message.includes('API_KEY') || message.includes('authentication') || message.includes('401')) {
      userMessage = 'Authentication failed. Please verify your API key settings.';
    } else if (status === 429 || message.includes('quota') || message.includes('429') || message.includes('Rate limit')) {
      userMessage = 'System is currently busy. Rate limit exceeded. Retrying shortly...';
    } else if (status === 404 || message.includes('not found') || message.includes('404')) {
      userMessage = 'The requested AI model or service could not be found.';
    } else if (status === 403) {
      userMessage = 'Access denied. Please check permission settings.';
    } else if (/network|timeout|fetch|connection/i.test(message)) {
      userMessage = 'Unable to connect to the AI service. Please check your internet connection.';
    }

    return new AIError(providerName, userMessage, status, { rawError: message });
  }
}
