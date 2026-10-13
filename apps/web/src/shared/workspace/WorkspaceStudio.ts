export type WorkspaceDensity = 'compact' | 'comfortable' | 'dense';

export interface WorkspaceStudioState {
  cardSize: number; cardSpacing: number; gridColumns: number; cardsPerPage: number; sidebarWidth: number;
  inspectorWidth: number; notificationWidth: number; panelWidth: number; fontScale: number;
  iconSize: number; animations: boolean; glassStrength: number; transparency: number;
  cornerRadius: number; accentColor: string; density: WorkspaceDensity; widgetVisibility: Record<string, boolean>;
  dragPanels: boolean; resizePanels: boolean;
}

const KEY = 'jarvis_workspace_studio_v1';
const DEFAULT: WorkspaceStudioState = {
  cardSize: 280, cardSpacing: 24, gridColumns: 2, cardsPerPage: 6, sidebarWidth: 200, inspectorWidth: 300,
  notificationWidth: 300, panelWidth: 1, fontScale: 1, iconSize: 18, animations: true,
  glassStrength: 72, transparency: 92, cornerRadius: 12, accentColor: '#7c3aed', density: 'comfortable',
  widgetVisibility: {}, dragPanels: false, resizePanels: false,
};
type Listener = () => void;

class WorkspaceStudio {
  private state = { ...DEFAULT };
  private listeners = new Set<Listener>();
  constructor() { this.load(); }
  getState() { return { ...this.state, widgetVisibility: { ...this.state.widgetVisibility } }; }
  update(patch: Partial<WorkspaceStudioState>) { this.state = { ...this.state, ...patch }; this.save(); this.listeners.forEach((listener) => listener()); }
  reset() { this.state = { ...DEFAULT }; this.save(); this.listeners.forEach((listener) => listener()); }
  exportLayout() { return JSON.stringify(this.state, null, 2); }
  importLayout(text: string) { const layout = JSON.parse(text) as Partial<WorkspaceStudioState>; this.update(layout); }
  subscribe(listener: Listener) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private load() { try { const raw = localStorage.getItem(KEY); if (raw) this.state = { ...DEFAULT, ...JSON.parse(raw) }; } catch (_) {} }
  private save() { try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (_) {} }
}
export const workspaceStudio = new WorkspaceStudio();
