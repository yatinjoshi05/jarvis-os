export const BrowserEvents = {
  PAGE_OPENED: 'browser:page_opened',
  PAGE_CLOSED: 'browser:page_closed',
  SEARCH_STARTED: 'browser:search_started',
  SEARCH_COMPLETED: 'browser:search_completed',
  FILE_OPENED: 'browser:file_opened',
  FILE_UPDATED: 'browser:file_updated',
  PROJECT_ANALYZED: 'browser:project_analyzed',
  CODE_GENERATED: 'browser:code_generated',
  CODE_REVIEW_COMPLETED: 'browser:code_review_completed'
} as const;

export type BrowserEvent = typeof BrowserEvents[keyof typeof BrowserEvents];

type BrowserEventListener = (data: any) => void;

class BrowserEventEmitter {
  private listeners: Map<string, Set<BrowserEventListener>> = new Map();

  public on(event: string, listener: BrowserEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: BrowserEventListener) {
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
          console.error(`Error in Browser event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const browserEventEmitter = new BrowserEventEmitter();
export default browserEventEmitter;
