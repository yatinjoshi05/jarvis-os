export const AgentEvents = {
  AGENT_REGISTERED: 'agent:registered',
  AGENT_STARTED: 'agent:started',
  AGENT_PAUSED: 'agent:paused',
  AGENT_RESUMED: 'agent:resumed',
  AGENT_STOPPED: 'agent:stopped',
  AGENT_ENABLED: 'agent:enabled',
  AGENT_DISABLED: 'agent:disabled',
  AGENT_UPDATED: 'agent:updated',
  AGENT_REMOVED: 'agent:removed',
  AGENT_RESTARTED: 'agent:restarted',
  AGENT_FAILED: 'agent:failed',
  TASK_CREATED: 'agent:task_created',
  TASK_COMPLETED: 'agent:task_completed',
  TASK_FAILED: 'agent:task_failed',
  WORKFLOW_STARTED: 'agent:workflow_started',
  WORKFLOW_FINISHED: 'agent:workflow_finished',
} as const;

export type AgentEvent = typeof AgentEvents[keyof typeof AgentEvents];

type AgentEventListener = (data: any) => void;

class AgentEventEmitter {
  private listeners: Map<string, Set<AgentEventListener>> = new Map();

  public on(event: string, listener: AgentEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: AgentEventListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  public emit(event: string, data?: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error in agent event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const agentEventEmitter = new AgentEventEmitter();
export default agentEventEmitter;
