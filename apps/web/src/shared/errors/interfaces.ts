import { ErrorSeverity } from './types';

/**
 * Diagnostic metadata attached to errors.
 */
export interface ErrorDiagnostics {
  timestamp: number;
  severity: ErrorSeverity;
  traceId?: string;
}
