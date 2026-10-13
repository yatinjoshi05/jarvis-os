export type MissionControlEventType =
  | 'voice detected'
  | 'memory updated'
  | 'system warning'
  | 'mission created'
  | 'agent activated';

export interface MissionControlEvent<T = unknown> {
  id: string;
  type: MissionControlEventType;
  timestamp: string;
  data: T;
}

type EventListener<T = unknown> = (event: MissionControlEvent<T>) => void;

export class MissionControlEventBus {
  private listeners: Map<MissionControlEventType, Set<EventListener>> = new Map();

  public emit<T>(type: MissionControlEventType, data: T): MissionControlEvent<T> {
    const event: MissionControlEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      data,
    };

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(event as MissionControlEvent);
        } catch (err) {
          console.error(`[EventBus] Error in event listener for ${type}:`, err);
        }
      });
    }

    return event;
  }

  public listen<T>(type: MissionControlEventType, callback: EventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const handlers = this.listeners.get(type)!;
    handlers.add(callback as EventListener);

    return () => {
      handlers.delete(callback as EventListener);
    };
  }

  public subscribe<T>(type: MissionControlEventType, callback: EventListener<T>): () => void {
    return this.listen(type, callback);
  }

  public unsubscribe<T>(type: MissionControlEventType, callback: EventListener<T>) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(callback as EventListener);
    }
  }

  public broadcast<T>(type: MissionControlEventType, data: T) {
    this.emit(type, data);
  }
}

export const eventBus = new MissionControlEventBus();
