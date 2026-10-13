import { create } from 'zustand';
import { AISuggestion } from '../types';

interface AISuggestionState {
  suggestions: AISuggestion[];
  selectedSuggestion: AISuggestion | null;
  query: string;
  loading: boolean;
  activeCardId: string | null;

  generateSuggestion: (prompt: string, shell?: string) => void;
  selectCard: (cardId: string, shell?: string) => void;
  copyCommand: (command: string) => Promise<boolean>;
  insertCommand: (command: string, setInput?: (cmd: string) => void) => void;
  clearSuggestions: () => void;
  setSelectedSuggestion: (suggestion: AISuggestion | null) => void;
}

const classifyRisk = (cmd: string): 'safe' | 'warning' => {
  const lower = cmd.toLowerCase();
  const warningPatterns = [
    /\brm\b/,
    /\bdelete\b/,
    /\bremove\b/,
    /\bkill\b/,
    /\btaskkill\b/,
    /\bformat\b/,
    /\bdrop\b/,
    /remove-item/,
    /stop-process/,
  ];
  for (const pattern of warningPatterns) {
    if (pattern.test(lower)) return 'warning';
  }
  return 'safe';
};

const getShellName = (shell?: string): string => {
  if (shell === 'cmd') return 'CMD';
  if (shell === 'gitbash' || shell === 'git-bash') return 'Git Bash';
  return 'PowerShell';
};

export const useAISuggestionStore = create<AISuggestionState>((set) => ({
  suggestions: [],
  selectedSuggestion: null,
  query: '',
  loading: false,
  activeCardId: null,

  selectCard: (cardId: string, shell = 'powershell') => {
    const activeShell = getShellName(shell);
    let newSuggestions: AISuggestion[] = [];

    switch (cardId) {
      case 's1': // Show running processes
        if (activeShell === 'CMD') {
          newSuggestions = [
            {
              id: 's1-cmd',
              title: 'Tasklist Process Viewer',
              description: 'Displays a list of currently running processes on local machine.',
              shell: 'CMD',
              command: 'tasklist',
              estimatedTime: '< 50ms',
              risk: 'safe',
            },
          ];
        } else if (activeShell === 'Git Bash') {
          newSuggestions = [
            {
              id: 's1-bash',
              title: 'POSIX Process Status',
              description: 'Snapshot of currently active processes in shell session.',
              shell: 'Git Bash',
              command: 'ps',
              estimatedTime: '< 30ms',
              risk: 'safe',
            },
          ];
        } else {
          newSuggestions = [
            {
              id: 's1-ps',
              title: 'Get Active PowerShell Processes',
              description: 'Retrieves all process resources active on local computer.',
              shell: 'PowerShell',
              command: 'Get-Process',
              estimatedTime: '< 80ms',
              risk: 'safe',
            },
          ];
        }
        break;

      case 's2': // Check system performance
        if (activeShell === 'CMD') {
          newSuggestions = [
            {
              id: 's2-cmd',
              title: 'WMIC CPU Load Query',
              description: 'Queries Windows Management Instrumentation for current CPU load percentage.',
              shell: 'CMD',
              command: 'wmic cpu get loadpercentage',
              estimatedTime: '~ 150ms',
              risk: 'safe',
            },
          ];
        } else if (activeShell === 'Git Bash') {
          newSuggestions = [
            {
              id: 's2-bash',
              title: 'Realtime Resource Monitor',
              description: 'Displays Linux/POSIX system summary information and task metrics.',
              shell: 'Git Bash',
              command: 'top',
              estimatedTime: 'Interactive',
              risk: 'safe',
            },
          ];
        } else {
          newSuggestions = [
            {
              id: 's2-ps',
              title: 'PowerShell Counter Inspection',
              description: 'Gets live performance counter data from OS subsystem.',
              shell: 'PowerShell',
              command: 'Get-Counter',
              estimatedTime: '~ 200ms',
              risk: 'safe',
            },
          ];
        }
        break;

      case 's3': // List files in current directory
        if (activeShell === 'CMD') {
          newSuggestions = [
            {
              id: 's3-cmd',
              title: 'Directory Contents',
              description: 'Displays a list of files and subdirectories in directory.',
              shell: 'CMD',
              command: 'dir',
              estimatedTime: '< 20ms',
              risk: 'safe',
            },
          ];
        } else if (activeShell === 'Git Bash') {
          newSuggestions = [
            {
              id: 's3-bash',
              title: 'Detailed Directory Listing',
              description: 'Lists all directory contents including hidden files with details.',
              shell: 'Git Bash',
              command: 'ls -la',
              estimatedTime: '< 30ms',
              risk: 'safe',
            },
          ];
        } else {
          newSuggestions = [
            {
              id: 's3-ps',
              title: 'Get Child Directory Items',
              description: 'Gets items and child items in current location.',
              shell: 'PowerShell',
              command: 'Get-ChildItem',
              estimatedTime: '< 40ms',
              risk: 'safe',
            },
          ];
        }
        break;

      case 's4': // Open command palette / git palette
        newSuggestions = [
          {
            id: 's4-1',
            title: 'Check Git Working Tree Status',
            description: 'Shows modified and staged files in current git repository.',
            shell: activeShell,
            command: 'git status',
            estimatedTime: '< 40ms',
            risk: 'safe',
          },
          {
            id: 's4-2',
            title: 'Fetch & Merge Remote Repository',
            description: 'Incorporates changes from remote repository into current branch.',
            shell: activeShell,
            command: 'git pull',
            estimatedTime: '~ 500ms',
            risk: 'safe',
          },
          {
            id: 's4-3',
            title: 'Checkout Target Branch',
            description: 'Switches branches or restores working tree files.',
            shell: activeShell,
            command: 'git checkout main',
            estimatedTime: '< 100ms',
            risk: 'safe',
          },
          {
            id: 's4-4',
            title: 'Start Local Development Server',
            description: 'Launches local dev server via npm scripts.',
            shell: activeShell,
            command: 'npm run dev',
            estimatedTime: 'Background process',
            risk: 'safe',
          },
        ];
        break;

      case 's5': // Clear terminal
        if (activeShell === 'Git Bash') {
          newSuggestions = [
            {
              id: 's5-bash',
              title: 'Clear Terminal Screen',
              description: 'Clears the active screen buffer in Git Bash.',
              shell: 'Git Bash',
              command: 'clear',
              estimatedTime: '< 10ms',
              risk: 'safe',
            },
          ];
        } else {
          newSuggestions = [
            {
              id: 's5-win',
              title: 'Clear Screen Buffer',
              description: 'Clears text and prompt buffer from terminal console window.',
              shell: activeShell,
              command: 'cls',
              estimatedTime: '< 10ms',
              risk: 'safe',
            },
          ];
        }
        break;

      default:
        newSuggestions = [];
    }

    set({
      activeCardId: cardId,
      suggestions: newSuggestions,
      selectedSuggestion: newSuggestions[0] || null,
      loading: false,
    });
  },

  generateSuggestion: (prompt: string, shell = 'powershell') => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    set({ loading: true, query: trimmed });
    const lower = trimmed.toLowerCase();
    const activeShell = getShellName(shell);

    let generatedSuggestions: AISuggestion[] = [];

    if (lower.includes('downloads') || lower.includes('download')) {
      generatedSuggestions = [
        {
          id: `gen-${Date.now()}-1`,
          title: 'Navigate to Downloads Directory',
          description: 'Changes active working directory to user Downloads folder.',
          shell: activeShell,
          command: 'cd Downloads',
          estimatedTime: '< 10ms',
          risk: 'safe',
        },
      ];
    } else if (lower.includes('node') || lower.includes('process')) {
      const cmd = activeShell === 'PowerShell' ? 'Get-Process node' : activeShell === 'CMD' ? 'tasklist /FI "IMAGENAME eq node.exe"' : 'pgrep node';
      generatedSuggestions = [
        {
          id: `gen-${Date.now()}-2`,
          title: 'Filter Node.js Processes',
          description: 'Searches and displays running Node.js process instances.',
          shell: activeShell,
          command: cmd,
          estimatedTime: '< 50ms',
          risk: classifyRisk(cmd),
        },
      ];
    } else if (lower.includes('disk') || lower.includes('storage') || lower.includes('usage')) {
      const cmd = activeShell === 'PowerShell' ? 'Get-PSDrive' : activeShell === 'CMD' ? 'wmic logicaldisk get size,freespace,caption' : 'df -h';
      generatedSuggestions = [
        {
          id: `gen-${Date.now()}-3`,
          title: 'Inspect Disk Drives & Storage Space',
          description: 'Displays drive letters, total volume capacity, and available free space.',
          shell: activeShell,
          command: cmd,
          estimatedTime: '< 60ms',
          risk: classifyRisk(cmd),
        },
      ];
    } else {
      // Natural language prompt fallback generator
      const risk = classifyRisk(trimmed);
      generatedSuggestions = [
        {
          id: `gen-${Date.now()}-fallback`,
          title: `AI Synthesized Command for "${trimmed}"`,
          description: `Constructed shell-compatible command payload for ${activeShell}.`,
          shell: activeShell,
          command: trimmed,
          estimatedTime: '< 30ms',
          risk,
        },
      ];
    }

    set({
      suggestions: generatedSuggestions,
      selectedSuggestion: generatedSuggestions[0] || null,
      loading: false,
    });
  },

  copyCommand: async (command: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(command);
        return true;
      }
    } catch (_) {}
    return false;
  },

  insertCommand: (command: string, setInput?: (cmd: string) => void) => {
    if (setInput) {
      setInput(command);
    }
  },

  clearSuggestions: () => {
    set({ suggestions: [], selectedSuggestion: null, activeCardId: null, query: '' });
  },

  setSelectedSuggestion: (suggestion: AISuggestion | null) => {
    set({ selectedSuggestion: suggestion });
  },
}));
