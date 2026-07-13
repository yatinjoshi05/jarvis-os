import { BaseError } from '../../shared/errors/BaseError';

export class CodingError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'CodingError';
  }
}

export class FileMissingError extends CodingError {
  constructor(filePath: string, context?: Record<string, unknown>) {
    super(`File "${filePath}" could not be found or does not exist.`, context);
    this.name = 'FileMissingError';
  }
}

export class RepositoryUnavailableError extends CodingError {
  constructor(repoPath: string, reason: string, context?: Record<string, unknown>) {
    super(`Repository at "${repoPath}" is unavailable: ${reason}`, context);
    this.name = 'RepositoryUnavailableError';
  }
}

export class TerminalFailureError extends CodingError {
  constructor(command: string, exitCode: number, stderr: string, context?: Record<string, unknown>) {
    super(`Terminal execution of "${command}" failed (exit code ${exitCode}): ${stderr}`, context);
    this.name = 'TerminalFailureError';
  }
}

export class PermissionDeniedError extends CodingError {
  constructor(action: string, context?: Record<string, unknown>) {
    super(`Permission denied: ${action}`, context);
    this.name = 'PermissionDeniedError';
  }
}
