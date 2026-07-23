export const DASHBOARD_CONFIG = {
  defaultTheme: {
    mode: 'dark' as const,
    accentColor: '#FF0055', // Pink accent from Nebula palette
  },
  defaultPanels: {
    leftSidebar: true,
    rightSidebar: true,
    dock: true,
    console: true,
  },
  defaultDockItems: [
    { id: 'chat', label: 'AI Chat', icon: 'chat', action: 'open_chat', order: 1, shortcut: 'Ctrl+Shift+C' },
    { id: 'coding', label: 'Coding Agent', icon: 'code', action: 'open_coding', order: 2, shortcut: 'Ctrl+Shift+D' },
    { id: 'browser', label: 'Browser Agent', icon: 'web', action: 'open_browser', order: 3, shortcut: 'Ctrl+Shift+B' },
    { id: 'finance', label: 'Finance OS', icon: 'finance', action: 'open_finance', order: 4, shortcut: 'Ctrl+Shift+F' },
    { id: 'crm', label: 'CRM OS', icon: 'crm', action: 'open_crm', order: 5, shortcut: 'Ctrl+Shift+R' },
  ],
  defaultSidebarItems: [
    { id: 'home', label: 'Dashboard', icon: 'home', path: '/', order: 1 },
    { id: 'chat', label: 'AI Assistant', icon: 'chat', path: '/assistant', order: 2 },
    { id: 'finance', label: 'Financial OS', icon: 'finance', path: '/finance', order: 3 },
    { id: 'crm', label: 'CRM Portal', icon: 'crm', path: '/crm', order: 4 },
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings', order: 5 },
  ],
  defaultWorkspaces: [
    { id: 'work_main', name: 'Main Workspace', category: 'WORK', isActive: true, widgets: ['music_player', 'weather'], createdAt: Date.now() },
    { id: 'work_code', name: 'Code Lab', category: 'CODE', isActive: false, widgets: ['cpu_load', 'memory_load'], createdAt: Date.now() },
    { id: 'work_finance', name: 'Finance Hub', category: 'FINANCE', isActive: false, widgets: ['market_indices'], createdAt: Date.now() },
  ],
  defaultWidgets: [
    { id: 'music_player', name: 'Music Player', category: 'PERSONAL', isEnabled: true, isVisible: true, order: 1 },
    { id: 'weather', name: 'Weather Forecast', category: 'PERSONAL', isEnabled: true, isVisible: true, order: 2 },
    { id: 'cpu_load', name: 'CPU monitor', category: 'SYSTEM', isEnabled: true, isVisible: true, order: 3 },
    { id: 'memory_load', name: 'Memory Load', category: 'SYSTEM', isEnabled: true, isVisible: true, order: 4 },
  ],
  toastDurationMs: 4000,
};

export default DASHBOARD_CONFIG;
