export interface AuditLogEntry {
  id: string;
  action: 'login' | 'logout' | 'failed_auth' | 'permission_change' | 'security_violation';
  userId?: string;
  timestamp: number;
  details: Record<string, any>;
  ipAddress?: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem('jarvis_security_audit_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (_) { /* ignore */ }
  }

  private saveLogs() {
    try {
      const truncated = this.logs.slice(-500);
      localStorage.setItem('jarvis_security_audit_logs', JSON.stringify(truncated));
    } catch (_) { /* ignore */ }
  }

  public log(
    action: AuditLogEntry['action'],
    details: Record<string, any>,
    userId?: string
  ) {
    const entry: AuditLogEntry = {
      id: `audit_${action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action,
      userId,
      timestamp: Date.now(),
      details,
    };

    this.logs.push(entry);
    this.saveLogs();

    const prefixStr = `[SECURITY AUDIT] [${action.toUpperCase()}]`;
    if (action === 'security_violation' || action === 'failed_auth') {
      console.warn(prefixStr, details);
    } else {
      console.log(prefixStr, details);
    }
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
    localStorage.removeItem('jarvis_security_audit_logs');
  }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
