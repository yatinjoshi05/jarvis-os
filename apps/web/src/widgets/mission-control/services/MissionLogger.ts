export type MissionLogEvent =
  | 'mission created'
  | 'mission completed'
  | 'mission failed'
  | 'agent started'
  | 'workflow executed'
  | 'security warning'
  | 'crash event';

export interface MissionLogEntry {
  timestamp: string;
  module: 'mission_control';
  event: MissionLogEvent;
  durationMs: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'RECOVERED';
  details?: Record<string, unknown>;
}

export class MissionLoggerService {
  private logs: MissionLogEntry[] = [];
  private readonly maxLogs: number = 1000;

  public log(
    event: MissionLogEvent,
    status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'RECOVERED',
    durationMs: number = 0,
    details?: Record<string, unknown>
  ): MissionLogEntry {
    const entry: MissionLogEntry = {
      timestamp: new Date().toISOString(),
      module: 'mission_control',
      event,
      durationMs,
      status,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (status === 'FAILED' || status === 'WARNING') {
      console.warn(`[MissionLogger] ${entry.timestamp} | ${event} | ${status} | ${durationMs}ms`, details || '');
    } else {
      console.log(`[MissionLogger] ${entry.timestamp} | ${event} | ${status} | ${durationMs}ms`);
    }

    return entry;
  }

  public getLogs(): MissionLogEntry[] {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const missionLogger = new MissionLoggerService();
