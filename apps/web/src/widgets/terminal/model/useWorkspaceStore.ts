import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaneNode, WorkspaceTab } from '../types';

interface WorkspaceState {
  activeWorkspaceId: string;
  tabs: WorkspaceTab[];
  activeTabId: string;
  paneTree: Record<string, PaneNode>; // tabId -> PaneNode root
  activePaneId: Record<string, string>; // tabId -> active pane terminalId

  addTab: (shell?: 'powershell' | 'cmd' | 'gitbash', name?: string, cwd?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  renameTab: (tabId: string, newName: string) => void;
  duplicateTab: (tabId: string) => string;
  reorderTabs: (newTabs: WorkspaceTab[]) => void;

  splitPane: (tabId: string, targetPaneId: string, direction: 'horizontal' | 'vertical', shell?: 'powershell' | 'cmd' | 'gitbash') => string | null;
  resizePane: (tabId: string, splitNodeId: string, ratio: number) => void;
  closePane: (tabId: string, paneId: string) => void;
  setActivePaneId: (tabId: string, paneId: string) => void;

  saveWorkspace: () => void;
  restoreWorkspace: () => void;
}

const DEFAULT_CWD = 'C:\\Users\\Yatin';
const MAX_TERMINALS = 20;

// Helper function to recursively count total leaf pane terminals in a tree
const countPanes = (node: PaneNode): number => {
  if (node.type === 'pane') return 1;
  if (!node.children) return 0;
  return node.children.reduce((acc, child) => acc + countPanes(child), 0);
};

// Helper function to split a target pane in the tree
const splitNodeInTree = (
  node: PaneNode,
  targetId: string,
  direction: 'horizontal' | 'vertical',
  newPaneId: string
): PaneNode => {
  if (node.type === 'pane' && (node.id === targetId || node.terminalId === targetId)) {
    const existingChild: PaneNode = {
      id: node.id,
      type: 'pane',
      terminalId: node.terminalId || node.id,
    };
    const newChild: PaneNode = {
      id: newPaneId,
      type: 'pane',
      terminalId: newPaneId,
    };
    return {
      id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'split',
      direction,
      ratio: 0.5,
      children: [existingChild, newChild],
    };
  }

  if (node.type === 'split' && node.children) {
    return {
      ...node,
      children: node.children.map((child) =>
        splitNodeInTree(child, targetId, direction, newPaneId)
      ),
    };
  }

  return node;
};

// Helper function to resize a split node ratio
const resizeNodeInTree = (node: PaneNode, splitNodeId: string, ratio: number): PaneNode => {
  if (node.id === splitNodeId && node.type === 'split') {
    return { ...node, ratio };
  }
  if (node.type === 'split' && node.children) {
    return {
      ...node,
      children: node.children.map((child) => resizeNodeInTree(child, splitNodeId, ratio)),
    };
  }
  return node;
};

// Helper function to close a pane in the tree
const closeNodeInTree = (node: PaneNode, targetId: string): PaneNode | null => {
  if (node.type === 'pane' && (node.id === targetId || node.terminalId === targetId)) {
    return null;
  }

  if (node.type === 'split' && node.children) {
    const updatedChildren = node.children
      .map((child) => closeNodeInTree(child, targetId))
      .filter((child): child is PaneNode => child !== null);

    if (updatedChildren.length === 0) return null;
    if (updatedChildren.length === 1) return updatedChildren[0];

    return {
      ...node,
      children: updatedChildren,
    };
  }

  return node;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: 'default',
      tabs: [
        { id: 'tab-1', name: 'PowerShell', shell: 'powershell', cwd: DEFAULT_CWD, active: true },
        { id: 'tab-2', name: 'CMD', shell: 'cmd', cwd: DEFAULT_CWD, active: false },
      ],
      activeTabId: 'tab-1',
      paneTree: {
        'tab-1': { id: 'pane-ps-1', type: 'pane', terminalId: 's-ps-1' },
        'tab-2': { id: 'pane-cmd-1', type: 'pane', terminalId: 's-cmd-1' },
      },
      activePaneId: {
        'tab-1': 's-ps-1',
        'tab-2': 's-cmd-1',
      },

      addTab: (shell = 'powershell', name, cwd = DEFAULT_CWD) => {
        const totalPanes = Object.values(get().paneTree).reduce(
          (acc, root) => acc + countPanes(root),
          0
        );

        if (totalPanes >= MAX_TERMINALS) {
          console.warn(`[WorkspaceStore] Capped at ${MAX_TERMINALS} maximum active terminals.`);
          return get().activeTabId;
        }

        const tabId = `tab-${Date.now()}`;
        const termId = `s-${shell}-${Date.now()}`;

        const nameMap: Record<string, string> = {
          powershell: 'PowerShell',
          cmd: 'CMD',
          gitbash: 'Git Bash',
        };

        const tabName = name || nameMap[shell] || 'Terminal';

        const newTab: WorkspaceTab = {
          id: tabId,
          name: tabName,
          shell,
          cwd,
          active: true,
        };

        const newPaneTree: PaneNode = {
          id: `pane-${termId}`,
          type: 'pane',
          terminalId: termId,
        };

        set((state) => ({
          tabs: state.tabs.map((t) => ({ ...t, active: false })).concat(newTab),
          activeTabId: tabId,
          paneTree: { ...state.paneTree, [tabId]: newPaneTree },
          activePaneId: { ...state.activePaneId, [tabId]: termId },
        }));

        return tabId;
      },

      closeTab: (tabId: string) => {
        set((state) => {
          const filtered = state.tabs.filter((t) => t.id !== tabId);
          if (filtered.length === 0) return state;

          const nextActiveId = state.activeTabId === tabId ? filtered[0].id : state.activeTabId;
          const newPaneTree = { ...state.paneTree };
          delete newPaneTree[tabId];

          const newActivePaneId = { ...state.activePaneId };
          delete newActivePaneId[tabId];

          return {
            tabs: filtered.map((t) => ({ ...t, active: t.id === nextActiveId })),
            activeTabId: nextActiveId,
            paneTree: newPaneTree,
            activePaneId: newActivePaneId,
          };
        });
      },

      setActiveTab: (tabId: string) => {
        set((state) => ({
          activeTabId: tabId,
          tabs: state.tabs.map((t) => ({ ...t, active: t.id === tabId })),
        }));
      },

      renameTab: (tabId: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, name: trimmed } : t)),
        }));
      },

      duplicateTab: (tabId: string) => {
        const targetTab = get().tabs.find((t) => t.id === tabId);
        if (!targetTab) return get().activeTabId;
        return get().addTab(targetTab.shell, `${targetTab.name} (Copy)`, targetTab.cwd);
      },

      reorderTabs: (newTabs: WorkspaceTab[]) => {
        set({ tabs: newTabs });
      },

      splitPane: (tabId, targetPaneId, direction, shell = 'powershell') => {
        const totalPanes = Object.values(get().paneTree).reduce(
          (acc, root) => acc + countPanes(root),
          0
        );

        if (totalPanes >= MAX_TERMINALS) {
          console.warn(`[WorkspaceStore] Capped at ${MAX_TERMINALS} maximum active terminals.`);
          return null;
        }

        const newTermId = `s-${shell}-${Date.now()}`;
        const root = get().paneTree[tabId];
        if (!root) return null;

        const targetId = targetPaneId || get().activePaneId[tabId] || 's-ps-1';
        const updatedRoot = splitNodeInTree(root, targetId, direction, newTermId);

        set((state) => ({
          paneTree: { ...state.paneTree, [tabId]: updatedRoot },
          activePaneId: { ...state.activePaneId, [tabId]: newTermId },
        }));

        return newTermId;
      },

      resizePane: (tabId, splitNodeId, ratio) => {
        const root = get().paneTree[tabId];
        if (!root) return;

        const boundedRatio = Math.max(0.15, Math.min(0.85, ratio));
        const updatedRoot = resizeNodeInTree(root, splitNodeId, boundedRatio);

        set((state) => ({
          paneTree: { ...state.paneTree, [tabId]: updatedRoot },
        }));
      },

      closePane: (tabId, paneId) => {
        const root = get().paneTree[tabId];
        if (!root) return;

        const updatedRoot = closeNodeInTree(root, paneId);
        if (!updatedRoot) {
          get().closeTab(tabId);
          return;
        }

        set((state) => ({
          paneTree: { ...state.paneTree, [tabId]: updatedRoot },
        }));
      },

      setActivePaneId: (tabId, paneId) => {
        set((state) => ({
          activePaneId: { ...state.activePaneId, [tabId]: paneId },
        }));
      },

      saveWorkspace: () => {
        // Automatically persisted by Zustand persist middleware
      },

      restoreWorkspace: () => {
        // Automatically restored on startup by Zustand persist middleware
      },
    }),
    {
      name: 'jarvis_terminal_workspace',
    }
  )
);
