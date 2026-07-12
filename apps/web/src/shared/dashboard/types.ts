export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export type SystemStatus = {
  ai: 'idle' | 'thinking' | 'speaking' | 'listening';
  voice: 'ready' | 'active' | 'muted';
  memory: {
    usagePercent: number;
    transientCount: number;
    persistentCount: number;
  };
  connection: ConnectionStatus;
  microphone: 'available' | 'unavailable' | 'permission_denied';
};

export type PanelVisibility = {
  leftSidebar: boolean;
  rightSidebar: boolean;
  dock: boolean;
  console: boolean;
};

export type LayoutConfig = {
  panels: PanelVisibility;
  splitView: boolean;
  columnsCount: number;
};
