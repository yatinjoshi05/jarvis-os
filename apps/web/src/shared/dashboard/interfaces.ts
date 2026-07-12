import { UserRole } from '../auth/types';

export interface Widget {
  id: string;
  name: string;
  category: string;
  isEnabled: boolean;
  isVisible: boolean;
  order: number;
  config?: Record<string, any>;
}

export interface Workspace {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  widgets: string[]; // Widget IDs associated with this workspace
  createdAt: number;
}

export interface DockItem {
  id: string;
  label: string;
  icon: string;
  action: string;
  order: number;
  shortcut?: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiredRole?: UserRole;
  order: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  duration?: number; // ms to auto-hide
}

export interface Command {
  id: string;
  text: string;
  description: string;
  category: string;
  execute: (args: string[]) => void | Promise<void>;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
}

export interface DashboardState {
  widgets: Widget[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  dockItems: DockItem[];
  sidebarItems: SidebarItem[];
  notifications: Notification[];
  activeSidebarCollapsed: boolean;
  theme: ThemeConfig;
}
