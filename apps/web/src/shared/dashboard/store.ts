import { DashboardState } from './interfaces';
import { DASHBOARD_CONFIG } from './config';

class DashboardStore {
  private state: DashboardState;
  private listeners = new Set<() => void>();

  constructor() {
    this.state = {
      widgets: [...DASHBOARD_CONFIG.defaultWidgets],
      workspaces: [...DASHBOARD_CONFIG.defaultWorkspaces],
      activeWorkspaceId: 'work_main',
      dockItems: [...DASHBOARD_CONFIG.defaultDockItems],
      sidebarItems: [...DASHBOARD_CONFIG.defaultSidebarItems],
      notifications: [],
      activeSidebarCollapsed: false,
      theme: { ...DASHBOARD_CONFIG.defaultTheme }
    };
    this.loadState();
  }

  private loadState() {
    try {
      const stored = localStorage.getItem('jarvis_dashboard_state');
      if (stored) {
        this.state = { ...this.state, ...JSON.parse(stored) };
      }
    } catch (_) { /* ignore */ }
  }

  public saveState() {
    try {
      localStorage.setItem('jarvis_dashboard_state', JSON.stringify(this.state));
    } catch (_) { /* ignore */ }
    this.notify();
  }

  public getState(): DashboardState {
    return this.state;
  }

  public setState(updates: Partial<DashboardState>) {
    this.state = { ...this.state, ...updates };
    this.saveState();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const dashboardStore = new DashboardStore();
export default dashboardStore;
