export const AIEvents = {
  AI_REQUEST_STARTED: 'ai:request_started',
  AI_STREAM_STARTED: 'ai:stream_started',
  AI_STREAM_UPDATED: 'ai:stream_updated',
  AI_STREAM_FINISHED: 'ai:stream_finished',
  AI_RESPONSE_COMPLETED: 'ai:response_completed',
  AI_ERROR: 'ai:error',
} as const;

export type AIEvent = typeof AIEvents[keyof typeof AIEvents];

type AIEventListener = (data: any) => void;

class AIEventEmitter {
  private listeners: Map<string, Set<AIEventListener>> = new Map();

  public on(event: string, listener: AIEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: AIEventListener) {
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
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const aiEventEmitter = new AIEventEmitter();
