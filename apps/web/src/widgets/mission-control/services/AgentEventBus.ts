export type AgentEventType =
  | 'agent:task_assigned'
  | 'agent:status_changed'
  | 'workflow:step_completed'
  | 'vision:screen_analyzed'
  | 'automation:triggered';

export interface AgentEventData<T = unknown> {
  id: string;
  type: AgentEventType;
  agentId?: string;
  timestamp: string;
  payload: T;
}

type AgentEventListener<T = unknown> = (event: AgentEventData<T>) => void;

export class AgentEventBus {
  private listeners: Map<AgentEventType, Set<AgentEventListener>> = new Map();

  public emit<T>(type: AgentEventType, payload: T, agentId?: string): AgentEventData<T> {
    const event: AgentEventData<T> = {
      id: `agevt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      agentId,
      timestamp: new Date().toISOString(),
      payload,
    };

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(event as AgentEventData);
        } catch (err) {
          console.error(`[AgentEventBus] Listener error for ${type}:`, err);
        }
      });
    }

    return event;
  }

  public listen<T>(type: AgentEventType, callback: AgentEventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const handlers = this.listeners.get(type)!;
    handlers.add(callback as AgentEventListener);

    return () => {
      handlers.delete(callback as AgentEventListener);
    };
  }

  public subscribe<T>(type: AgentEventType, callback: AgentEventListener<T>): () => void {
    return this.listen(type, callback);
  }

  public unsubscribe<T>(type: AgentEventType, callback: AgentEventListener<T>) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(callback as AgentEventListener);
    }
  }

  public broadcast<T>(type: AgentEventType, payload: T) {
    this.emit(type, payload);
  }
}

export const agentEventBus = new AgentEventBus();
