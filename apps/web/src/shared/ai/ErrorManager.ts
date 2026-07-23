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

  public static mapProviderError(providerName: string, error: any, url?: string): AIError {
    if (error instanceof AIError) return error;

    const message = error?.message || String(error);
    const status = error?.status || error?.statusCode || Number(message.match(/\bHTTP\s+(\d{3})\b/i)?.[1]) || undefined;
    const responseBody = error?.responseBody || error?.body || error?.response?.data;
    const errorText = [message, typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody ?? '')]
      .join(' ')
      .toLowerCase();

    const isDev = (() => { try { return Boolean((import.meta as any)?.env?.DEV); } catch (_) { return false; } })();
    if (isDev) {
      console.error('[AI Provider Error]', {
        provider: providerName,
        url,
        message,
        status,
        responseBody,
        originalError: error,
      });
    }

    let userMessage = 'An unexpected error occurred in the AI system. Please try again.';

    if (/econnrefused|err_connection_refused|connection refused|proxy error|failed to fetch|networkerror/.test(errorText)) {
      userMessage = 'Unable to reach the local JARVIS AI backend. Make sure the backend server is running, then try again.';
    } else if (status === 401 || message.includes('API_KEY') || message.includes('authentication') || message.includes('401')) {
      userMessage = `Authentication failed for ${providerName}. Please verify your API key settings.`;
    } else if (status === 429 || /quota|rate limit|resource_exhausted/.test(errorText)) {
      userMessage = `Rate limit or quota exceeded for ${providerName}. Please wait and try again, or check the provider plan and billing.`;
    } else if (status === 404 || message.includes('not found') || message.includes('404')) {
      userMessage = `The requested model or service for ${providerName} could not be found.`;
    } else if (status === 403) {
      userMessage = `Access denied for ${providerName}. Please check permission settings.`;
    } else if (status === 408 || /timed out/i.test(message)) {
      userMessage = 'The AI request timed out. Please retry.';
    } else if (/network|fetch|connection|refused/i.test(message)) {
      userMessage = 'Unable to connect to the AI service. Please check your network connection and try again.';
    }

    return new AIError(providerName, userMessage, status, { rawError: message, responseBody, url });
  }

  public static getFriendlyErrorMessage(error: any): string {
    if (error instanceof AIError) {
      return error.message;
    }
    const mapped = this.mapProviderError('AI Service', error);
    return mapped.message;
  }
}
