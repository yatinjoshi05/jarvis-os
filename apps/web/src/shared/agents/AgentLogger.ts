export interface AgentLogEntry {
  agentId: string;
  action: string;
  status: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  details: Record<string, any>;
}

class AgentLogger {
  private logs: AgentLogEntry[] = [];

  public log(agentId: string, action: string, status: AgentLogEntry['status'], details: Record<string, any> = {}) {
    const entry: AgentLogEntry = {
      agentId,
      action,
      status,
      timestamp: Date.now(),
      details
    };

    this.logs.push(entry);

    const prefix = `[AGENT LOG] [${status.toUpperCase()}] [Agent:${agentId}] [${action}]`;
    if (status === 'error') {
      console.error(prefix, details);
    } else if (status === 'warning') {
      console.warn(prefix, details);
    } else {
      console.log(prefix, details);
    }
  }

  public getLogsByAgent(agentId: string): AgentLogEntry[] {
    return this.logs.filter((l) => l.agentId === agentId);
  }

  public getLogs(): AgentLogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
  }
}

export const agentLogger = new AgentLogger();
export default agentLogger;
