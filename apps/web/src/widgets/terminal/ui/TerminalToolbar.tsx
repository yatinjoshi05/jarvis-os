import React, { useState } from 'react';
import { TerminalTab } from '../types';
import { TerminalTabs } from './TerminalTabs';
import { Trash2, Columns, Rows, Settings, Maximize2 } from 'lucide-react';

interface TerminalToolbarProps {
  tabs: TerminalTab[];
  activeTabId: string;
  isGitBashAvailable?: boolean;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab?: (id: string) => void;
  onClear: () => void;
  onSplit: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onToggleMaximize: () => void;
  onOpenSettings: () => void;
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  tabs,
  activeTabId,
  isGitBashAvailable = true,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onClear,
  onSplit,
  onSplitHorizontal,
  onSplitVertical,
  onToggleMaximize,
  onOpenSettings,
}) => {
  const [showSplitMenu, setShowSplitMenu] = useState(false);

  return (
    <div className="flex items-center justify-between px-3 py-1 bg-[#0B0C10]/80 backdrop-blur-md border-b border-white/10 select-none relative">
      {/* Left section: Terminal tabs */}
      <TerminalTabs
        tabs={tabs}
        activeTabId={activeTabId}
        isGitBashAvailable={isGitBashAvailable}
        onSelectTab={onSelectTab}
        onAddTab={onAddTab}
        onCloseTab={onCloseTab}
      />

      {/* Right section: Toolbar actions */}
      <div className="flex items-center space-x-1 text-white/60 relative">
        <button
          onClick={onClear}
          title="Clear Terminal"
          className="p-1 hover:text-[#EC4899] hover:bg-white/5 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Split Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSplitMenu(!showSplitMenu)}
            title="Split Terminal Options"
            className="p-1 hover:text-[#00DFFF] hover:bg-white/5 rounded transition-colors"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>

          {showSplitMenu && (
            <div
              className="absolute right-0 top-full mt-1 z-50 bg-[#0D0E15] border border-white/10 rounded-lg shadow-2xl py-1 w-36 text-[10px] font-mono text-white/80"
              onClick={() => setShowSplitMenu(false)}
            >
              <button
                onClick={() => {
                  if (onSplitVertical) onSplitVertical();
                  else onSplit();
                }}
                className="w-full px-2.5 py-1 hover:bg-white/10 flex items-center space-x-2 text-left"
              >
                <Columns className="w-3 h-3 text-[#00DFFF]" />
                <span>Split Vertical</span>
              </button>

              <button
                onClick={() => {
                  if (onSplitHorizontal) onSplitHorizontal();
                  else onSplit();
                }}
                className="w-full px-2.5 py-1 hover:bg-white/10 flex items-center space-x-2 text-left"
              >
                <Rows className="w-3 h-3 text-amber-400" />
                <span>Split Horizontal</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onToggleMaximize}
          title="Maximize Terminal"
          className="p-1 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenSettings}
          title="Terminal Settings"
          className="p-1 hover:text-[#00DFFF] hover:bg-white/5 rounded transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
