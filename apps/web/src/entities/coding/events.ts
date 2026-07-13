export const CodingEvents = {
  CODE_CREATED: 'coding:code_created',
  CODE_UPDATED: 'coding:code_updated',
  CODE_REFACTORED: 'coding:code_refactored',
  DEBUG_STARTED: 'coding:debug_started',
  DEBUG_COMPLETED: 'coding:debug_completed',
  TEST_STARTED: 'coding:test_started',
  TEST_COMPLETED: 'coding:test_completed'
} as const;

export type CodingEvent = typeof CodingEvents[keyof typeof CodingEvents];

type CodingEventListener = (data: any) => void;

class CodingEventEmitter {
  private listeners: Map<string, Set<CodingEventListener>> = new Map();

  public on(event: string, listener: CodingEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: CodingEventListener) {
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
          console.error(`Error in Coding event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const codingEventEmitter = new CodingEventEmitter();
export default codingEventEmitter;
