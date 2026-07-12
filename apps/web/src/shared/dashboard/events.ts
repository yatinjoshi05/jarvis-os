export const DashboardEvents = {
  WIDGET_OPENED: 'dashboard:widget_opened',
  WIDGET_CLOSED: 'dashboard:widget_closed',
  WORKSPACE_CHANGED: 'dashboard:workspace_changed',
  COMMAND_EXECUTED: 'dashboard:command_executed',
  SIDEBAR_COLLAPSED: 'dashboard:sidebar_collapsed',
  SIDEBAR_EXPANDED: 'dashboard:sidebar_expanded',
  NOTIFICATION_CREATED: 'dashboard:notification_created',
  THEME_CHANGED: 'dashboard:theme_changed',
  STATUS_CHANGED: 'dashboard:status_changed',
} as const;

export type DashboardEvent = typeof DashboardEvents[keyof typeof DashboardEvents];

type DashboardEventListener = (data: any) => void;

class DashboardEventEmitter {
  private listeners: Map<string, Set<DashboardEventListener>> = new Map();

  public on(event: string, listener: DashboardEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: DashboardEventListener) {
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
          console.error(`Error in dashboard event listener for ${event}:`, e);
        }
      });
    }
  }
}

export const dashboardEventEmitter = new DashboardEventEmitter();
export default dashboardEventEmitter;
