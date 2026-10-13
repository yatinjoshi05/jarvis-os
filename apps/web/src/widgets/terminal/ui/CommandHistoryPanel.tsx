import React, { useState, useId } from 'react';
import { useCommandHistoryStore } from '../model/useCommandHistoryStore';
import { ChevronDown, ChevronRight, Trash2, Search, Pin, PinOff, Clock } from 'lucide-react';

interface CommandHistoryPanelProps {
  onSelectCommand: (cmd: string) => void;
  onExecuteCommand?: (cmd: string) => void;
}

export const CommandHistoryPanel: React.FC<CommandHistoryPanelProps> = ({
  onSelectCommand,
  onExecuteCommand,
}) => {
  const {
    historyItems,
    searchQuery,
    setSearchQuery,
    removeHistory,
    clearHistory,
    pinHistory,
  } = useCommandHistoryStore();

  const [isOpen, setIsOpen] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const searchInputId = useId();

  const filteredItems = historyItems.filter((item) =>
    item.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.cwd.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.shell.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedItems = filteredItems.filter((item) => item.pinned);
  const recentItems = filteredItems.filter((item) => !item.pinned);

  const formatTime = (ts: number | string): string => {
    const d = typeof ts === 'number' ? new Date(ts) : new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatShellName = (shell: string): string => {
    if (shell === 'powershell') return 'PowerShell';
    if (shell === 'cmd') return 'CMD';
    if (shell === 'gitbash' || shell === 'git-bash') return 'Git Bash';
    return shell;
  };

  const handleClearClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmClear = () => {
    clearHistory();
    setShowConfirmModal(false);
  };

  return (
    <div className="border-b border-white/10 p-2.5 flex flex-col relative select-none">
      {/* Panel Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none mb-2 group"
      >
        <span className="text-[10px] font-bold font-mono tracking-wider text-[#00DFFF] uppercase flex items-center space-x-1.5">
          <span>COMMAND HISTORY</span>
          {filteredItems.length > 0 && (
            <span className="text-white/40 text-[9px]">({filteredItems.length})</span>
          )}
        </span>
        <button className="text-white/40 group-hover:text-white transition-colors">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Panel Content */}
      {isOpen && (
        <div className="space-y-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-white/40" />
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter history... (Ctrl+R)"
              className="w-full pl-6 pr-2 py-1 rounded bg-white/[0.04] border border-white/10 text-white text-[10px] font-mono placeholder:text-white/30 focus:outline-none focus:border-[#00DFFF]/50"
            />
          </div>

          {/* List Area */}
          <div className="space-y-2 max-h-56 overflow-y-auto hide-scrollbar pr-0.5">
            {/* Pinned Section */}
            {pinnedItems.length > 0 && (
              <div className="space-y-1">
                <div className="text-[9px] font-mono font-bold text-[#00DFFF]/80 flex items-center space-x-1 px-1">
                  <Pin className="w-2.5 h-2.5" />
                  <span>Pinned</span>
                </div>
                {pinnedItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-2 py-1.5 rounded bg-white/[0.03] hover:bg-white/10 text-white/80 hover:text-white font-mono text-[10px] cursor-pointer transition-all duration-150 flex flex-col space-y-0.5 group border border-white/[0.05]"
                    onClick={() => (onExecuteCommand ? onExecuteCommand(item.command) : onSelectCommand(item.command))}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate">{item.command}</span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => pinHistory(item.id)}
                          title="Unpin command"
                          className="text-[#00DFFF] hover:text-white p-0.5"
                        >
                          <PinOff className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeHistory(item.id)}
                          title="Delete item"
                          className="text-rose-400 hover:text-rose-300 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-white/40 font-mono">
                      <span>{formatShellName(item.shell)} • {item.cwd}</span>
                      <span className="flex items-center space-x-0.5">
                        <Clock className="w-2.5 h-2.5 inline" />
                        <span>{formatTime(item.timestamp)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Section */}
            {recentItems.length > 0 && (
              <div className="space-y-1">
                {pinnedItems.length > 0 && (
                  <div className="text-[9px] font-mono font-bold text-white/50 flex items-center space-x-1 px-1 pt-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>Recent</span>
                  </div>
                )}
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-2 py-1.5 rounded bg-white/[0.02] hover:bg-white/10 text-white/70 hover:text-white font-mono text-[10px] cursor-pointer transition-all duration-150 flex flex-col space-y-0.5 group"
                    onClick={() => (onExecuteCommand ? onExecuteCommand(item.command) : onSelectCommand(item.command))}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.command}</span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => pinHistory(item.id)}
                          title="Pin command"
                          className="text-white/40 hover:text-[#00DFFF] p-0.5"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeHistory(item.id)}
                          title="Delete item"
                          className="text-white/40 hover:text-rose-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-white/40 font-mono">
                      <span>{formatShellName(item.shell)} • {item.cwd}</span>
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-4 text-white/30 text-[10px] font-mono">
                No matching history items
              </div>
            )}
          </div>

          {/* Clear History Button */}
          <button
            onClick={handleClearClick}
            className="w-full mt-2 py-1 px-2.5 rounded bg-[#EC4899]/10 hover:bg-[#EC4899]/20 text-[#EC4899] font-mono text-[10px] font-medium flex items-center justify-center space-x-1.5 transition-colors border border-[#EC4899]/20"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear History</span>
          </button>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0D0E15] border border-white/10 rounded-xl p-4 max-w-xs w-full shadow-2xl text-center space-y-3">
            <h3 className="text-white font-mono text-xs font-bold">Clear all command history?</h3>
            <p className="text-white/60 font-mono text-[10px]">
              This will remove all non-pinned commands from history. Pinned commands will remain.
            </p>
            <div className="flex justify-center space-x-2 pt-1">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-3 py-1 rounded bg-[#EC4899] hover:bg-[#ff2a85] text-white font-mono text-[10px] font-bold transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
