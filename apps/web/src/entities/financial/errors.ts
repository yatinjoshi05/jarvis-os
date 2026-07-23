import { BaseError } from '../../shared/errors/BaseError';

export class FinancialError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'FinancialError';
  }
}

export class LedgerVerificationError extends FinancialError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'LedgerVerificationError';
  }
}

export class InvalidFinancialDataError extends FinancialError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'InvalidFinancialDataError';
  }
}

export class ProfileNotFoundError extends FinancialError {
  constructor(userId: string, context?: Record<string, unknown>) {
    super(`Financial profile for user "${userId}" not found.`, context);
    this.name = 'ProfileNotFoundError';
  }
}

export class CalculationFailureError extends FinancialError {
  constructor(calculatorName: string, reason: string, context?: Record<string, unknown>) {
    super(`Calculation in "${calculatorName}" failed: ${reason}`, context);
    this.name = 'CalculationFailureError';
  }
}

export class ProviderUnavailableError extends FinancialError {
  constructor(providerName: string, context?: Record<string, unknown>) {
    super(`Fintech provider "${providerName}" is unavailable.`, context);
    this.name = 'ProviderUnavailableError';
  }
}

export class DocumentFailureError extends FinancialError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'DocumentFailureError';
  }
}
