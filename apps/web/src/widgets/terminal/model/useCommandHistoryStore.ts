import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CommandHistoryItem } from '../types';

interface CommandHistoryState {
  historyItems: CommandHistoryItem[];
  searchQuery: string;
  selectedId: string | null;

  addHistory: (command: string, shell: 'powershell' | 'cmd' | 'gitbash', cwd: string) => void;
  removeHistory: (id: string) => void;
  removeSelectedHistory: (ids: string[]) => void;
  clearHistory: () => void;
  pinHistory: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedId: (id: string | null) => void;
}

const MAX_HISTORY_ITEMS = 10000;

export const useCommandHistoryStore = create<CommandHistoryState>()(
  persist(
    (set) => ({
      historyItems: [
        { id: 'h1', command: 'echo hello', shell: 'powershell', cwd: 'C:\\Users\\Yatin', timestamp: Date.now() - 3600000, pinned: true },
        { id: 'h2', command: 'dir', shell: 'powershell', cwd: 'C:\\Users\\Yatin', timestamp: Date.now() - 3000000, pinned: true },
        { id: 'h3', command: 'cd Downloads', shell: 'powershell', cwd: 'C:\\Users\\Yatin', timestamp: Date.now() - 2400000, pinned: false },
        { id: 'h4', command: 'whoami', shell: 'powershell', cwd: 'C:\\Users\\Yatin', timestamp: Date.now() - 1800000, pinned: false },
        { id: 'h5', command: 'pwd', shell: 'powershell', cwd: 'C:\\Users\\Yatin', timestamp: Date.now() - 1200000, pinned: false },
        { id: 'h6', command: 'npm -v', shell: 'powershell', cwd: 'C:\\Users\\Yatin', timestamp: Date.now() - 600000, pinned: false },
        { id: 'h7', command: 'git --version', shell: 'powershell', cwd: 'C:\\Users\\Yatin', timestamp: Date.now() - 300000, pinned: false },
      ],
      searchQuery: '',
      selectedId: null,

      addHistory: (command: string, shell: 'powershell' | 'cmd' | 'gitbash', cwd: string) => {
        const trimmed = command.trim();
        if (!trimmed) return;

        set((state) => {
          const filtered = state.historyItems.filter((item) => item.command !== trimmed);
          const newItem: CommandHistoryItem = {
            id: `h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            command: trimmed,
            shell,
            cwd,
            timestamp: Date.now(),
            pinned: false,
          };

          const updated = [newItem, ...filtered];
          if (updated.length > MAX_HISTORY_ITEMS) {
            updated.length = MAX_HISTORY_ITEMS;
          }
          return { historyItems: updated };
        });
      },

      removeHistory: (id: string) => {
        set((state) => ({
          historyItems: state.historyItems.filter((item) => item.id !== id),
        }));
      },

      removeSelectedHistory: (ids: string[]) => {
        const idSet = new Set(ids);
        set((state) => ({
          historyItems: state.historyItems.filter((item) => !idSet.has(item.id)),
        }));
      },

      clearHistory: () => {
        set((state) => ({
          historyItems: state.historyItems.filter((item) => item.pinned),
        }));
      },

      pinHistory: (id: string) => {
        set((state) => ({
          historyItems: state.historyItems.map((item) =>
            item.id === id ? { ...item, pinned: !item.pinned } : item
          ),
        }));
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setSelectedId: (id: string | null) => {
        set({ selectedId: id });
      },
    }),
    {
      name: 'jarvis_terminal_command_history',
    }
  )
);
