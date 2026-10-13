export type BrowserLogEvent =
  | 'preview_opened'
  | 'preview_closed'
  | 'preview_failed'
  | 'reload_triggered'
  | 'renderer_crashed'
  | 'security_warning';

export interface BrowserLogEntry {
  timestamp: string;
  event: BrowserLogEvent;
  module: 'browser';
  durationMs: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'RECOVERED';
  details?: Record<string, unknown>;
}

export class BrowserLoggerService {
  private logs: BrowserLogEntry[] = [];
  private readonly maxLogs: number = 1000;

  public log(
    event: BrowserLogEvent,
    status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'RECOVERED',
    durationMs: number = 0,
    details?: Record<string, unknown>
  ): BrowserLogEntry {
    const entry: BrowserLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      module: 'browser',
      durationMs,
      status,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Output structured telemetry entry to console for dev debugging
    if (status === 'FAILED' || status === 'WARNING') {
      console.warn(`[BrowserLogger] ${entry.timestamp} | ${event} | ${status} | ${durationMs}ms`, details || '');
    } else {
      console.log(`[BrowserLogger] ${entry.timestamp} | ${event} | ${status} | ${durationMs}ms`);
    }

    return entry;
  }

  public getLogs(filterEvent?: BrowserLogEvent): BrowserLogEntry[] {
    if (filterEvent) {
      return this.logs.filter((l) => l.event === filterEvent);
    }
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const browserLogger = new BrowserLoggerService();
