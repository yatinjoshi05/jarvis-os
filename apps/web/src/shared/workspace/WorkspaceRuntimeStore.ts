import { workspaceEventBus } from './WorkspaceEventBus';
import type { WorkspaceActivity, WorkspaceError, WorkspaceEventType, WorkspaceId, WorkspaceLifecycle, WorkspaceNotification, WorkspaceRuntimeState } from './types';

const STORAGE_KEY = 'jarvis_workspace_runtime_v1';
const MAX_ACTIVITY = 250;
type Listener = () => void;

const now = () => Date.now();
const makeId = (prefix: string) => `${prefix}_${now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

function createState(id: WorkspaceId): WorkspaceRuntimeState {
  return { id, status: 'idle', notifications: [], errors: [], history: [], lastUpdated: now(), context: {}, navigation: { visitedAt: now() } };
}

/**
 * Framework-neutral workspace state. It persists lightweight restoration data only;
 * workspaces remain responsible for loading their heavy content lazily.
 */
class WorkspaceRuntimeStore {
  private states: Record<WorkspaceId, WorkspaceRuntimeState> = {};
  private listeners = new Set<Listener>();

  constructor() { this.restore(); }

  get(workspaceId: WorkspaceId): WorkspaceRuntimeState {
    return this.states[workspaceId] ?? createState(workspaceId);
  }

  getAll(): Readonly<Record<WorkspaceId, WorkspaceRuntimeState>> { return this.states; }

  subscribe(listener: Listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  update(workspaceId: WorkspaceId, patch: Partial<Omit<WorkspaceRuntimeState, 'id' | 'lastUpdated'>>): WorkspaceRuntimeState {
    const state = { ...this.get(workspaceId), ...patch, lastUpdated: now() };
    this.states = { ...this.states, [workspaceId]: state };
    this.persist(); this.notify();
    return state;
  }

  setStatus(workspaceId: WorkspaceId, status: WorkspaceLifecycle): WorkspaceRuntimeState {
    const state = this.update(workspaceId, { status });
    this.emit('status.changed', workspaceId, { status });
    return state;
  }

  setTask(workspaceId: WorkspaceId, currentTask?: string): WorkspaceRuntimeState { return this.update(workspaceId, { currentTask }); }

  setProgress(workspaceId: WorkspaceId, value: number, label?: string): WorkspaceRuntimeState {
    const progress = { value: Math.max(0, Math.min(100, value)), label, updatedAt: now() };
    const state = this.update(workspaceId, { progress });
    this.emit('progress.updated', workspaceId, progress);
    return state;
  }

  setContext(workspaceId: WorkspaceId, context: Record<string, unknown>): WorkspaceRuntimeState {
    const state = this.update(workspaceId, { context: { ...this.get(workspaceId).context, ...context } });
    this.emit('context.changed', workspaceId, context);
    return state;
  }

  setSelection(workspaceId: WorkspaceId, selection: unknown): WorkspaceRuntimeState {
    const state = this.update(workspaceId, { selection }); this.emit('selection.changed', workspaceId, selection); return state;
  }

  setNavigation(workspaceId: WorkspaceId, path: string, scrollTop?: number): WorkspaceRuntimeState {
    return this.update(workspaceId, { navigation: { path, scrollTop, visitedAt: now() } });
  }

  notifyWorkspace(workspaceId: WorkspaceId, message: string, level: WorkspaceNotification['level'] = 'info'): WorkspaceNotification {
    const notification = { id: makeId('notice'), message, level, createdAt: now(), read: false };
    this.update(workspaceId, { notifications: [...this.get(workspaceId).notifications, notification] });
    this.emit('notification.created', workspaceId, notification); return notification;
  }

  reportError(workspaceId: WorkspaceId, message: string, options: Pick<WorkspaceError, 'code' | 'cause'> = {}): WorkspaceError {
    const error = { id: makeId('error'), message, ...options, occurredAt: now() };
    this.update(workspaceId, { status: 'error', errors: [...this.get(workspaceId).errors, error] });
    this.emit('error.created', workspaceId, error); return error;
  }

  log(workspaceId: WorkspaceId, type: WorkspaceEventType, summary: string, metadata?: Record<string, unknown>): WorkspaceActivity {
    const activity: WorkspaceActivity = { id: makeId('activity'), type, summary, createdAt: now(), metadata };
    const history = [...this.get(workspaceId).history, activity].slice(-MAX_ACTIVITY);
    this.update(workspaceId, { history }); this.emit('activity.logged', workspaceId, activity); return activity;
  }

  private emit(type: WorkspaceEventType, workspaceId: WorkspaceId, payload: unknown): void {
    workspaceEventBus.emit({ id: makeId('event'), type, workspaceId, occurredAt: now(), payload });
  }
  private notify(): void { this.listeners.forEach(listener => listener()); }
  private persist(): void { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.states)); } catch { /* non-critical persistence */ } }
  private restore(): void { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) this.states = JSON.parse(stored) as Record<WorkspaceId, WorkspaceRuntimeState>; } catch { this.states = {}; } }
}

export const workspaceRuntimeStore = new WorkspaceRuntimeStore();
