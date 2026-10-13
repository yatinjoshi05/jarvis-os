import { missionLogger } from './MissionLogger';

export type SecurityThreatType =
  | 'path_traversal'
  | 'xss_injection'
  | 'malicious_script'
  | 'unsafe_command'
  | 'unauthorized_action'
  | 'privilege_escalation';

export type SecurityAction = 'block' | 'warn' | 'log' | 'sandbox';

export interface SecurityIncident {
  id: string;
  threatType: SecurityThreatType;
  inputPayload: string;
  actionTaken: SecurityAction;
  timestamp: string;
  mitigated: boolean;
}

export class SecurityManagerService {
  private incidents: SecurityIncident[] = [];

  public inspectPayload(input: string): { safe: boolean; threat?: SecurityThreatType } {
    const payload = input.toLowerCase();

    // 1. Path Traversal Check
    if (payload.includes('../') || payload.includes('..\\') || payload.includes('c:/windows') || payload.includes('system32')) {
      this.recordIncident('path_traversal', input, 'block');
      return { safe: false, threat: 'path_traversal' };
    }

    // 2. XSS & Script Injection Check
    if (payload.includes('<script>') || payload.includes('javascript:') || payload.includes('onerror=') || payload.includes('onload=')) {
      this.recordIncident('xss_injection', input, 'sandbox');
      return { safe: false, threat: 'xss_injection' };
    }

    // 3. Unsafe Command Check
    if (payload.includes('rm -rf') || payload.includes('format c:') || payload.includes('drop database')) {
      this.recordIncident('unsafe_command', input, 'block');
      return { safe: false, threat: 'unsafe_command' };
    }

    return { safe: true };
  }

  public recordIncident(threatType: SecurityThreatType, payload: string, action: SecurityAction): SecurityIncident {
    const startTime = performance.now();
    const incident: SecurityIncident = {
      id: `sec-${Date.now()}`,
      threatType,
      inputPayload: payload,
      actionTaken: action,
      timestamp: new Date().toISOString(),
      mitigated: true,
    };

    this.incidents.unshift(incident);
    const duration = Math.round(performance.now() - startTime);
    missionLogger.log('security warning', 'WARNING', duration, { threatType, payload, action });
    return incident;
  }

  public getIncidents(): SecurityIncident[] {
    return this.incidents;
  }
}

export const securityManager = new SecurityManagerService();
