export const MemoryEvents = {
  MEMORY_CREATED: 'memory:created',
  MEMORY_UPDATED: 'memory:updated',
  MEMORY_DELETED: 'memory:deleted',
  MEMORY_LOADED: 'memory:loaded',
  MEMORY_SEARCHED: 'memory:searched',
  MEMORY_COMPRESSED: 'memory:compressed',
} as const;

export type MemoryEvent = typeof MemoryEvents[keyof typeof MemoryEvents];

type MemoryEventListener = (data: any) => void;

class MemoryEventEmitter {
  private listeners: Map<string, Set<MemoryEventListener>> = new Map();

  public on(event: string, listener: MemoryEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: MemoryEventListener) {
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
          console.error(`Error in memory event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const memoryEventEmitter = new MemoryEventEmitter();
