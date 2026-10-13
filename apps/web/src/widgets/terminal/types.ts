/**
 * Custom color themes for console emulators.
 */
export type TerminalWidgetTheme = 'matrix' | 'classic-dark' | 'powershell-blue' | 'cyberpunk-dark';

export type TerminalShellType = 'powershell' | 'cmd' | 'git-bash' | 'gitbash';

export interface TerminalTab {
  id: string;
  name: string;
  type: TerminalShellType;
  active: boolean;
  cwd: string;
}

export interface TerminalSession {
  id: string;
  shell: 'powershell' | 'cmd' | 'gitbash';
  cwd: string;
  isActive: boolean;
  createdAt: number;
  status: 'starting' | 'idle' | 'executing' | 'error' | 'closed';
  lines: TerminalLineItem[];
}

export type TerminalTextColor = 'cyan' | 'purple' | 'green' | 'white' | 'red' | 'muted' | 'yellow';

export interface TerminalOutputToken {
  text: string;
  color?: TerminalTextColor;
  bold?: boolean;
}

export interface TerminalLineItem {
  id: string;
  type: 'banner' | 'prompt' | 'output' | 'error' | 'warning' | 'info';
  promptPath?: string;
  command?: string;
  tokens?: TerminalOutputToken[];
  text?: string;
  timestamp?: string;
  state?: TerminalVisualState;
}

export type TerminalVisualState = 'idle' | 'executing' | 'success' | 'error' | 'warning';

export interface CommandHistoryItem {
  id: string;
  command: string;
  shell: 'powershell' | 'cmd' | 'gitbash';
  cwd: string;
  timestamp: number;
  pinned: boolean;
}

export interface AISuggestionCard {
  id: string;
  title: string;
  command: string;
  category?: string;
}

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  shell: string;
  command: string;
  estimatedTime: string;
  risk: 'safe' | 'warning';
}

export interface PaneNode {
  id: string;
  type: 'pane' | 'split';
  direction?: 'horizontal' | 'vertical';
  children?: PaneNode[];
  ratio?: number;
  terminalId?: string;
}

export interface WorkspaceTab {
  id: string;
  name: string;
  shell: 'powershell' | 'cmd' | 'gitbash';
  cwd: string;
  active: boolean;
}
