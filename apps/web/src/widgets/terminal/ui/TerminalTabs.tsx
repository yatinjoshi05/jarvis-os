import React, { useState } from 'react';
import { TerminalTab } from '../types';
import { Plus, X, Copy, Edit2, Columns, Rows } from 'lucide-react';
import { useWorkspaceStore } from '../model/useWorkspaceStore';

interface TerminalTabsProps {
  tabs: TerminalTab[];
  activeTabId: string;
  isGitBashAvailable?: boolean;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onCloseTab?: (id: string) => void;
}

export const TerminalTabs: React.FC<TerminalTabsProps> = ({
  tabs,
  activeTabId,
  isGitBashAvailable = true,
  onSelectTab,
  onAddTab,
  onCloseTab,
}) => {
  const { renameTab, duplicateTab, closeTab, splitPane } = useWorkspaceStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [contextMenuTabId, setContextMenuTabId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const visibleTabs = tabs.filter(
    (tab) => isGitBashAvailable || (tab.type !== 'git-bash' && tab.type !== ('gitbash' as any))
  );

  const handleDoubleClick = (tab: TerminalTab) => {
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  const handleRenameSubmit = (tabId: string) => {
    if (editingName.trim()) {
      renameTab(tabId, editingName.trim());
    }
    setEditingTabId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenuTabId(tabId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = () => {
    setContextMenuTabId(null);
  };

  return (
    <div className="flex items-center space-x-1 overflow-x-auto hide-scrollbar relative select-none" onClick={handleCloseContextMenu}>
      {visibleTabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isEditing = editingTabId === tab.id;

        return (
          <div
            key={tab.id}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className={`group px-2.5 py-1 text-[11px] font-medium font-mono rounded-t transition-all duration-200 flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              isActive
                ? 'bg-[#12131C] text-[#00DFFF] border-[#00DFFF] shadow-[0_2px_8px_rgba(0,223,255,0.15)] font-semibold'
                : 'bg-white/5 text-white/60 hover:text-white/90 hover:bg-white/10 border-transparent'
            }`}
            onClick={() => onSelectTab(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab)}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRenameSubmit(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(tab.id);
                  if (e.key === 'Escape') setEditingTabId(null);
                }}
                autoFocus
                className="bg-black/60 text-[#00DFFF] px-1 py-0.5 rounded text-[10px] outline-none font-mono border border-[#00DFFF]/50"
              />
            ) : (
              <span>{tab.name}</span>
            )}

            {visibleTabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCloseTab) onCloseTab(tab.id);
                  else closeTab(tab.id);
                }}
                title="Close Tab"
                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={onAddTab}
        title="New Terminal Tab"
        className="p-1 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center justify-center"
      >
        <Plus className="w-3 h-3" />
      </button>

      {/* Right Click Context Menu */}
      {contextMenuTabId && (
        <div
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
          className="fixed z-50 bg-[#0D0E15] border border-white/10 rounded-lg shadow-2xl py-1 w-40 text-[10px] font-mono text-white/80"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const target = visibleTabs.find((t) => t.id === contextMenuTabId);
              if (target) {
                setEditingTabId(target.id);
                setEditingName(target.name);
              }
              handleCloseContextMenu();
            }}
            className="w-full px-2.5 py-1 hover:bg-white/10 flex items-center space-x-2 text-left"
          >
            <Edit2 className="w-3 h-3 text-[#00DFFF]" />
            <span>Rename Tab</span>
          </button>

          <button
            onClick={() => {
              duplicateTab(contextMenuTabId);
              handleCloseContextMenu();
            }}
            className="w-full px-2.5 py-1 hover:bg-white/10 flex items-center space-x-2 text-left"
          >
            <Copy className="w-3 h-3 text-purple-400" />
            <span>Duplicate Tab</span>
          </button>

          <button
            onClick={() => {
              splitPane(contextMenuTabId, '', 'vertical');
              handleCloseContextMenu();
            }}
            className="w-full px-2.5 py-1 hover:bg-white/10 flex items-center space-x-2 text-left"
          >
            <Columns className="w-3 h-3 text-emerald-400" />
            <span>Split Vertical</span>
          </button>

          <button
            onClick={() => {
              splitPane(contextMenuTabId, '', 'horizontal');
              handleCloseContextMenu();
            }}
            className="w-full px-2.5 py-1 hover:bg-white/10 flex items-center space-x-2 text-left"
          >
            <Rows className="w-3 h-3 text-amber-400" />
            <span>Split Horizontal</span>
          </button>

          {visibleTabs.length > 1 && (
            <button
              onClick={() => {
                closeTab(contextMenuTabId);
                handleCloseContextMenu();
              }}
              className="w-full px-2.5 py-1 hover:bg-rose-500/20 text-rose-400 flex items-center space-x-2 text-left border-t border-white/5 mt-1"
            >
              <X className="w-3 h-3" />
              <span>Close Tab</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
