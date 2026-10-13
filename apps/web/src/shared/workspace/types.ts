/** Shared contracts for every JARVIS OS workspace. UI implementation stays workspace-owned. */
export type WorkspaceId = string;

export const WORKSPACE_LIFECYCLE = [
  'idle', 'loading', 'ready', 'working', 'paused', 'completed', 'error', 'synchronizing',
] as const;
export type WorkspaceLifecycle = (typeof WORKSPACE_LIFECYCLE)[number];

export const WORKSPACE_PERMISSIONS = [
  'read', 'write', 'execute', 'preview', 'delete', 'rename', 'create',
] as const;
export type WorkspacePermission = (typeof WORKSPACE_PERMISSIONS)[number];

export const WORKSPACE_COMPONENTS = [
  'page-header', 'workspace-title', 'workspace-status', 'toolbar', 'action-buttons',
  'search-bar', 'filters', 'breadcrumbs', 'context-panel', 'content-area',
  'bottom-status-bar', 'loading-state', 'empty-state', 'error-state', 'success-state',
  'progress-state', 'progress-card', 'activity-feed', 'information-card', 'status-badge',
  'timeline', 'log-viewer', 'inspector-panel', 'action-button',
] as const;
export type WorkspaceComponent = (typeof WORKSPACE_COMPONENTS)[number];

export type WorkspaceEventType =
  | 'workspace.opened' | 'workspace.closed' | 'workspace.restored'
  | 'task.started' | 'task.completed' | 'task.failed'
  | 'progress.updated' | 'context.changed' | 'selection.changed'
  | 'status.changed' | 'notification.created' | 'error.created' | 'activity.logged';

export interface WorkspaceProgress {
  value: number;
  label?: string;
  updatedAt: number;
}

export interface WorkspaceNotification {
  id: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  createdAt: number;
  read: boolean;
}

export interface WorkspaceError {
  id: string;
  message: string;
  code?: string;
  cause?: unknown;
  occurredAt: number;
}

export interface WorkspaceActivity {
  id: string;
  type: WorkspaceEventType;
  summary: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

/** Serializable state a workspace owns and restores when it becomes active again. */
export interface WorkspaceRuntimeState {
  id: WorkspaceId;
  status: WorkspaceLifecycle;
  currentTask?: string;
  progress?: WorkspaceProgress;
  notifications: WorkspaceNotification[];
  errors: WorkspaceError[];
  history: WorkspaceActivity[];
  lastUpdated: number;
  context: Record<string, unknown>;
  selection?: unknown;
  navigation: { path?: string; scrollTop?: number; visitedAt: number };
}

export interface WorkspaceDefinition {
  id: WorkspaceId;
  title: string;
  route: string;
  permissions?: readonly WorkspacePermission[];
  components?: readonly WorkspaceComponent[];
}

export interface WorkspaceEvent<T = unknown> {
  id: string;
  type: WorkspaceEventType;
  workspaceId: WorkspaceId;
  occurredAt: number;
  payload?: T;
}
