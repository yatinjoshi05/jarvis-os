import { missionLogger } from './MissionLogger';

export type RecoveryAction = 'retry' | 'restart' | 'fallback' | 'notify' | 'rollback';

export interface IncidentRecord {
  id: string;
  source: string;
  errorType: 'agent_crash' | 'automation_failed' | 'broken_preview' | 'network_error' | 'missing_file' | 'timeout';
  recoveryAction: RecoveryAction;
  timestamp: string;
  resolved: boolean;
}

export class RecoveryManagerService {
  private incidents: IncidentRecord[] = [];

  public handleIncident(
    source: string,
    errorType: IncidentRecord['errorType'],
    action: RecoveryAction
  ): IncidentRecord {
    const startTime = performance.now();
    const incident: IncidentRecord = {
      id: `inc-${Date.now()}`,
      source,
      errorType,
      recoveryAction: action,
      timestamp: new Date().toISOString(),
      resolved: true,
    };

    this.incidents.unshift(incident);
    const duration = Math.round(performance.now() - startTime);
    missionLogger.log('crash event', 'RECOVERED', duration, { source, errorType, action });
    return incident;
  }

  public getIncidents(): IncidentRecord[] {
    return this.incidents;
  }

  public getUnresolvedCount(): number {
    return this.incidents.filter((i) => !i.resolved).length;
  }
}

export const recoveryManager = new RecoveryManagerService();
