import { BaseError } from '../errors/BaseError';

export class AuthError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'AuthError';
  }
}

export class AuthTokenExpiredError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'AuthTokenExpiredError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'InvalidCredentialsError';
  }
}

export class SessionExpiredError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'SessionExpiredError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'ForbiddenError';
  }
}

export class InvalidTokenError extends AuthError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'InvalidTokenError';
  }
}
