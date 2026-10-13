export type RuntimeEventType = 'AgentInstalled' | 'AgentUninstalled' | 'AgentStarted' | 'AgentStopped' | 'AgentRestarted' | 'AgentPaused' | 'AgentResumed' | 'AgentEnabled' | 'AgentDisabled' | 'Heartbeat' | 'TaskFinished' | 'TaskFailed' | 'PermissionGranted' | 'ApiConfigured' | 'ConfigurationChanged';
export interface RuntimeEvent { id: string; type: RuntimeEventType; agentId: string; timestamp: string; payload?: Record<string, unknown>; }
type Listener = (event: RuntimeEvent) => void;

export class RuntimeEventBus {
  private listeners = new Set<Listener>();
  public subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  public publish(type: RuntimeEventType, agentId: string, payload?: Record<string, unknown>): RuntimeEvent { const event: RuntimeEvent = { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, type, agentId, timestamp: new Date().toISOString(), payload }; this.listeners.forEach(listener => listener(event)); return event; }
}
export const runtimeEventBus = new RuntimeEventBus();
