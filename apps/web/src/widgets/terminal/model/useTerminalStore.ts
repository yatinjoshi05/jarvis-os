import { create } from 'zustand';
import { TerminalSession, TerminalLineItem, TerminalOutputToken } from '../types';

interface TerminalState {
  sessions: TerminalSession[];
  activeSessionId: string;
  isGitBashAvailable: boolean;

  createSession: (shell?: 'powershell' | 'cmd' | 'gitbash', cwd?: string) => string;
  switchSession: (id: string) => void;
  appendOutput: (sessionId: string, content: string | TerminalOutputToken[], type?: 'output' | 'error' | 'warning' | 'info' | 'banner' | 'prompt', promptPath?: string, command?: string) => void;
  setSessionStatus: (sessionId: string, status: TerminalSession['status']) => void;
  setSessionCwd: (sessionId: string, cwd: string) => void;
  closeSession: (id: string) => void;
  clearSession: (id: string) => void;
  setGitBashAvailable: (available: boolean) => void;
}

const DEFAULT_CWD = 'C:\\Users\\Yatin';

const INITIAL_POWERSHELL_LINES: TerminalLineItem[] = [
  { id: 'b1', type: 'banner', text: 'Windows PowerShell' },
  { id: 'b2', type: 'banner', text: 'Copyright (c) Microsoft Corporation. All rights reserved.' },
  { id: 'b3', type: 'banner', text: '' },
  { id: 'b4', type: 'banner', text: 'Try the new cross-platform PowerShell https://aka.ms/pscore6' },
  { id: 'b5', type: 'banner', text: '' },
];

export const useTerminalStore = create<TerminalState>((set) => ({
  sessions: [
    {
      id: 's-ps-1',
      shell: 'powershell',
      cwd: DEFAULT_CWD,
      isActive: true,
      createdAt: Date.now(),
      status: 'idle',
      lines: [...INITIAL_POWERSHELL_LINES],
    },
    {
      id: 's-cmd-1',
      shell: 'cmd',
      cwd: DEFAULT_CWD,
      isActive: false,
      createdAt: Date.now() + 1,
      status: 'idle',
      lines: [
        { id: 'cmd-b1', type: 'banner', text: 'Microsoft Windows [Version 10.0.22631.3880]' },
        { id: 'cmd-b2', type: 'banner', text: '(c) Microsoft Corporation. All rights reserved.' },
        { id: 'cmd-b3', type: 'banner', text: '' },
      ],
    },
  ],
  activeSessionId: 's-ps-1',
  isGitBashAvailable: true,

  createSession: (shell = 'powershell', cwd = DEFAULT_CWD) => {
    const id = `s-${shell}-${Date.now()}`;
    const nameMap: Record<string, string> = {
      powershell: 'PowerShell',
      cmd: 'CMD',
      gitbash: 'Git Bash',
    };
    const newSession: TerminalSession = {
      id,
      shell,
      cwd,
      isActive: true,
      createdAt: Date.now(),
      status: 'idle',
      lines: [
        {
          id: `init-${id}`,
          type: 'banner',
          text: `[JARVIS OS] Active Terminal Session: ${nameMap[shell] || shell.toUpperCase()}`,
        },
        { id: `init-space-${id}`, type: 'banner', text: '' },
      ],
    };

    set((state) => ({
      sessions: state.sessions.map((s) => ({ ...s, isActive: false })).concat(newSession),
      activeSessionId: id,
    }));

    return id;
  },

  switchSession: (id) => {
    set((state) => ({
      activeSessionId: id,
      sessions: state.sessions.map((s) => ({ ...s, isActive: s.id === id })),
    }));
  },

  appendOutput: (sessionId, content, type = 'output', promptPath, command) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;

        let newLine: TerminalLineItem;
        if (type === 'prompt') {
          newLine = {
            id: String(Date.now() + Math.random()),
            type: 'prompt',
            promptPath: promptPath || `${s.cwd}>`,
            command: command || '',
          };
        } else if (typeof content === 'string') {
          newLine = {
            id: String(Date.now() + Math.random()),
            type,
            text: content,
          };
        } else {
          newLine = {
            id: String(Date.now() + Math.random()),
            type,
            tokens: content,
          };
        }

        return {
          ...s,
          lines: [...s.lines, newLine],
        };
      }),
    }));
  },

  setSessionStatus: (sessionId, status) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, status } : s)),
    }));
  },

  setSessionCwd: (sessionId, cwd) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, cwd } : s)),
    }));
  },

  closeSession: (id) => {
    set((state) => {
      const filtered = state.sessions.filter((s) => s.id !== id);
      if (filtered.length === 0) return state;

      const nextActiveId = state.activeSessionId === id ? filtered[0].id : state.activeSessionId;
      return {
        sessions: filtered.map((s) => ({ ...s, isActive: s.id === nextActiveId })),
        activeSessionId: nextActiveId,
      };
    });
  },

  clearSession: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          lines: [],
        };
      }),
    }));
  },

  setGitBashAvailable: (available) => {
    set({ isGitBashAvailable: available });
  },
}));
