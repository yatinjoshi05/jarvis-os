import { useState, useEffect } from 'react';
import { useTerminalStore } from '../model/useTerminalStore';
import { useCommandHistoryStore } from '../model/useCommandHistoryStore';
import { useAISuggestionStore } from '../model/useAISuggestionStore';
import { useWorkspaceStore } from '../model/useWorkspaceStore';
import { terminalService } from '../services/TerminalService';
import {
  TerminalTab,
  AISuggestionCard,
} from '../types';
import { TerminalToolbar } from './TerminalToolbar';
import { PaneView } from './PaneView';
import { CommandHistoryPanel } from './CommandHistoryPanel';
import { AISuggestionPanel } from './AISuggestionPanel';
import { TerminalInput } from './TerminalInput';
import { TerminalStatusBar } from './TerminalStatusBar';
import { TerminalSettings } from './TerminalSettings';

const SUGGESTION_CARDS: AISuggestionCard[] = [
  { id: 's1', title: 'Show running processes', command: 'tasklist' },
  { id: 's2', title: 'Check system performance', command: 'systeminfo' },
  { id: 's3', title: 'List files in current directory', command: 'dir' },
  { id: 's4', title: 'Check Node version', command: 'node -v' },
  { id: 's5', title: 'Clear terminal', command: 'cls' },
];

export default function TerminalPage() {
  const {
    sessions,
    isGitBashAvailable,
    createSession,
    clearSession,
  } = useTerminalStore();

  const {
    tabs,
    activeTabId,
    paneTree,
    activePaneId,
    addTab,
    closeTab,
    setActiveTab,
    splitPane,
  } = useWorkspaceStore();

  const { historyItems, addHistory } = useCommandHistoryStore();

  const [inputValue, setInputValue] = useState<string>('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Settings state
  const [fontSize, setFontSize] = useState<number>(14);
  const [opacity, setOpacity] = useState<number>(95);

  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const targetTerminalId = (activePaneId && activePaneId[activeTabId]) || (currentTab ? `s-${currentTab.shell}-1` : 's-ps-1');
  const activeSession = sessions.find((s) => s.id === targetTerminalId) || sessions[0];

  // Initialize Git Bash availability check on mount
  useEffect(() => {
    terminalService.initializeGitBashCheck();
  }, []);

  // Ensure initial sessions exist for tabs
  useEffect(() => {
    tabs.forEach((tab) => {
      const rootNode = paneTree[tab.id];
      if (rootNode) {
        const checkTerminals = (node: any) => {
          if (node.type === 'pane' && node.terminalId) {
            const exists = sessions.some((s) => s.id === node.terminalId);
            if (!exists) {
              createSession(tab.shell, tab.cwd);
            }
          } else if (node.type === 'split' && node.children) {
            node.children.forEach(checkTerminals);
          }
        };
        checkTerminals(rootNode);
      }
    });
  }, [tabs, paneTree, sessions, createSession]);

  // Keyboard Shortcuts Listener (Ctrl+C, Ctrl+D, Ctrl+L, Ctrl+R, Up/Down Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + C -> Interrupt process
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && window.getSelection()?.toString() === '') {
        e.preventDefault();
        terminalService.sendInterrupt(targetTerminalId);
      }

      // Ctrl + D -> Close active tab
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }

      // Ctrl + L -> Clear screen
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        clearSession(targetTerminalId);
      }

      // Ctrl + R -> Focus history search input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Filter history"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Up Arrow -> Previous command in history
      if (e.key === 'ArrowUp' && document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type === 'text') {
        const activeInput = document.activeElement as HTMLInputElement;
        if (!activeInput.placeholder.includes('Filter history')) {
          if (historyItems.length > 0) {
            e.preventDefault();
            const nextIdx = Math.min(historyIndex + 1, historyItems.length - 1);
            setHistoryIndex(nextIdx);
            setInputValue(historyItems[nextIdx].command);
          }
        }
      }

      // Down Arrow -> Next command in history
      if (e.key === 'ArrowDown' && document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type === 'text') {
        const activeInput = document.activeElement as HTMLInputElement;
        if (!activeInput.placeholder.includes('Filter history')) {
          if (historyIndex >= 0) {
            e.preventDefault();
            const nextIdx = historyIndex - 1;
            setHistoryIndex(nextIdx);
            if (nextIdx >= 0) {
              setInputValue(historyItems[nextIdx].command);
            } else {
              setInputValue('');
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetTerminalId, activeTabId, closeTab, clearSession, historyIndex, historyItems]);

  const mappedTabs: TerminalTab[] = tabs.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.shell === 'gitbash' ? ('git-bash' as any) : t.shell,
    active: t.id === activeTabId,
    cwd: t.cwd,
  }));

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
  };

  const handleAddTab = () => {
    addTab('powershell');
  };

  const handleCloseTab = (id: string) => {
    closeTab(id);
  };

  const handleClearTerminal = () => {
    clearSession(targetTerminalId);
  };

  const handleSplitVertical = () => {
    const newTermId = splitPane(activeTabId, targetTerminalId, 'vertical', currentTab ? currentTab.shell : 'powershell');
    if (newTermId) {
      createSession(currentTab ? currentTab.shell : 'powershell', currentTab ? currentTab.cwd : 'C:\\Users\\Yatin');
    }
  };

  const handleSplitHorizontal = () => {
    const newTermId = splitPane(activeTabId, targetTerminalId, 'horizontal', currentTab ? currentTab.shell : 'powershell');
    if (newTermId) {
      createSession(currentTab ? currentTab.shell : 'powershell', currentTab ? currentTab.cwd : 'C:\\Users\\Yatin');
    }
  };

  const handleExecuteCommand = (cmd: string) => {
    if (!cmd.trim()) return;

    // Save to persistent command history store
    addHistory(
      cmd.trim(),
      activeSession ? activeSession.shell : 'powershell',
      activeSession ? activeSession.cwd : 'C:\\Users\\Yatin'
    );

    // Reset history navigation index
    setHistoryIndex(-1);

    // Execute real command via terminalService for active pane
    terminalService.executeCommand(targetTerminalId, cmd);

    setInputValue('');
  };

  const activePaneNode = paneTree[activeTabId] || { id: 'pane-root', type: 'pane', terminalId: targetTerminalId };

  return (
    <div
      className="terminal-module flex flex-col h-full w-full bg-[#050508] text-white font-mono select-none overflow-hidden"
      style={{ opacity: opacity / 100 }}
    >
      {/* Top Toolbar */}
      <TerminalToolbar
        tabs={mappedTabs}
        activeTabId={activeTabId}
        isGitBashAvailable={isGitBashAvailable}
        onSelectTab={handleSelectTab}
        onAddTab={handleAddTab}
        onCloseTab={handleCloseTab}
        onClear={handleClearTerminal}
        onSplit={handleSplitVertical}
        onSplitVertical={handleSplitVertical}
        onSplitHorizontal={handleSplitHorizontal}
        onToggleMaximize={() => {}}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Section: 70% Terminal Workspace + 30% Right Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Terminal Workspace (70%) */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/40">
          <div className="flex flex-1 overflow-hidden min-w-0 min-h-0">
            <PaneView
              tabId={activeTabId}
              node={activePaneNode}
              getSessionLines={(termId) => {
                const s = sessions.find((x) => x.id === termId);
                return s ? s.lines : [];
              }}
              getSessionCwd={(termId) => {
                const s = sessions.find((x) => x.id === termId);
                return s ? s.cwd : 'C:\\Users\\Yatin';
              }}
              getSessionStatus={(termId) => {
                const s = sessions.find((x) => x.id === termId);
                return s ? (s.status as any) : 'idle';
              }}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSubmitCommand={handleExecuteCommand}
            />
          </div>

          {/* Bottom AI Input Bar */}
          <TerminalInput
            onSend={handleExecuteCommand}
            onAskAI={(val) => useAISuggestionStore.getState().generateSuggestion(val, activeSession ? activeSession.shell : 'powershell')}
          />
        </div>

        {/* Right Sidebar (30%) */}
        <div className="w-72 lg:w-80 flex flex-col bg-[#0A0B10]/95 backdrop-blur-md border-l border-white/10 shrink-0">
          <CommandHistoryPanel
            onSelectCommand={(cmd) => setInputValue(cmd)}
            onExecuteCommand={(cmd) => handleExecuteCommand(cmd)}
          />

          <AISuggestionPanel
            suggestions={SUGGESTION_CARDS}
            activeShell={activeSession ? activeSession.shell : 'powershell'}
            onSelectSuggestion={(cmd) => setInputValue(cmd)}
            onAskJARVIS={() => useAISuggestionStore.getState().generateSuggestion('Show running processes', activeSession ? activeSession.shell : 'powershell')}
          />
        </div>
      </div>

      {/* Terminal Status Bar */}
      <TerminalStatusBar
        shellType={activeSession ? (activeSession.shell === 'gitbash' ? ('git-bash' as any) : activeSession.shell) : 'powershell'}
        cwd={activeSession ? activeSession.cwd : 'C:\\Users\\Yatin'}
        isOnline={true}
        statusState={activeSession ? activeSession.status.toUpperCase() : 'IDLE'}
      />

      {/* Terminal Settings Modal */}
      <TerminalSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        opacity={opacity}
        setOpacity={setOpacity}
      />
    </div>
  );
}
