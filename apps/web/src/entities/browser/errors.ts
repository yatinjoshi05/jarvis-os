import { BaseError } from '../../shared/errors/BaseError';

export class BrowserError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'BrowserError';
  }
}

export class NavigationFailureError extends BrowserError {
  constructor(url: string, reason: string, context?: Record<string, unknown>) {
    super(`Browser failed to navigate to "${url}": ${reason}`, context);
    this.name = 'NavigationFailureError';
  }
}

export class SearchFailureError extends BrowserError {
  constructor(query: string, reason: string, context?: Record<string, unknown>) {
    super(`Search query "${query}" failed: ${reason}`, context);
    this.name = 'SearchFailureError';
  }
}

export class PermissionDeniedError extends BrowserError {
  constructor(action: string, context?: Record<string, unknown>) {
    super(`Permission denied for action: ${action}`, context);
    this.name = 'PermissionDeniedError';
  }
}
