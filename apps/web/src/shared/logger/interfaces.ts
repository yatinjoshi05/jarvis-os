import { LogLevel } from './types';

/**
 * Structure of an individual log record.
 */
export interface LogRecord {
  timestamp: number;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}
