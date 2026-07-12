import { BaseError } from '../errors/BaseError';

export class MemoryError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'MemoryError';
  }
}

export class MemoryOverflowError extends MemoryError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'MemoryOverflowError';
  }
}

export class MemoryProviderUnavailableError extends MemoryError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'MemoryProviderUnavailableError';
  }
}

export class MemoryCorruptedError extends MemoryError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'MemoryCorruptedError';
  }
}

export class MemoryNotFoundError extends MemoryError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'MemoryNotFoundError';
  }
}
