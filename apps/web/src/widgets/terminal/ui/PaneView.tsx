import React, { useRef, useState } from 'react';
import { PaneNode, TerminalLineItem, TerminalVisualState } from '../types';
import { TerminalWindow } from './TerminalWindow';
import { useWorkspaceStore } from '../model/useWorkspaceStore';

interface PaneViewProps {
  tabId: string;
  node: PaneNode;
  getSessionLines: (terminalId: string) => TerminalLineItem[];
  getSessionCwd: (terminalId: string) => string;
  getSessionStatus: (terminalId: string) => TerminalVisualState;
  inputValue: string;
  onInputChange: (val: string) => void;
  onSubmitCommand: (cmd: string) => void;
}

export const PaneView: React.FC<PaneViewProps> = ({
  tabId,
  node,
  getSessionLines,
  getSessionCwd,
  getSessionStatus,
  inputValue,
  onInputChange,
  onSubmitCommand,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { resizePane, activePaneId, setActivePaneId } = useWorkspaceStore();

  if (node.type === 'pane') {
    const termId = node.terminalId || node.id;
    const lines = getSessionLines(termId);
    const cwd = getSessionCwd(termId);
    const status = getSessionStatus(termId);
    const isActivePane = activePaneId[tabId] === termId || activePaneId[tabId] === node.id;

    return (
      <div
        onClick={() => setActivePaneId(tabId, termId)}
        className={`flex-1 flex flex-col min-w-0 min-h-0 relative ${
          isActivePane ? 'ring-1 ring-[#00DFFF]/40 z-10' : 'opacity-95'
        }`}
      >
        <TerminalWindow
          lines={lines}
          currentPromptPath={`${cwd}>`}
          inputValue={isActivePane ? inputValue : ''}
          onInputChange={onInputChange}
          onSubmitCommand={onSubmitCommand}
          visualState={status}
          isSplitView={false}
        />
      </div>
    );
  }

  if (node.type === 'split' && node.children && node.children.length === 2) {
    const [childA, childB] = node.children;
    const ratio = node.ratio ?? 0.5;
    const isVertical = node.direction === 'vertical';

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let newRatio = 0.5;

        if (isVertical) {
          const offsetX = moveEvent.clientX - rect.left;
          newRatio = offsetX / rect.width;
        } else {
          const offsetY = moveEvent.clientY - rect.top;
          newRatio = offsetY / rect.height;
        }

        resizePane(tabId, node.id, newRatio);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    return (
      <div
        ref={containerRef}
        className={`flex-1 flex w-full h-full min-w-0 min-h-0 relative select-none ${
          isVertical ? 'flex-row' : 'flex-col'
        }`}
      >
        {/* First Child Pane */}
        <div
          style={{
            flexBasis: `${ratio * 100}%`,
            flexGrow: 0,
            flexShrink: 0,
          }}
          className="flex min-w-0 min-h-0 overflow-hidden"
        >
          <PaneView
            tabId={tabId}
            node={childA}
            getSessionLines={getSessionLines}
            getSessionCwd={getSessionCwd}
            getSessionStatus={getSessionStatus}
            inputValue={inputValue}
            onInputChange={onInputChange}
            onSubmitCommand={onSubmitCommand}
          />
        </div>

        {/* Draggable Divider Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`group z-20 flex items-center justify-center transition-colors ${
            isVertical
              ? 'w-1.5 cursor-col-resize hover:bg-[#00DFFF] bg-white/10'
              : 'h-1.5 cursor-row-resize hover:bg-[#00DFFF] bg-white/10'
          } ${isDragging ? 'bg-[#00DFFF] shadow-[0_0_10px_#00DFFF]' : ''}`}
        >
          <div
            className={`rounded-full bg-white/40 group-hover:bg-white ${
              isVertical ? 'w-0.5 h-4' : 'h-0.5 w-4'
            }`}
          />
        </div>

        {/* Second Child Pane */}
        <div
          style={{
            flexBasis: `${(1 - ratio) * 100}%`,
            flexGrow: 1,
            flexShrink: 1,
          }}
          className="flex min-w-0 min-h-0 overflow-hidden"
        >
          <PaneView
            tabId={tabId}
            node={childB}
            getSessionLines={getSessionLines}
            getSessionCwd={getSessionCwd}
            getSessionStatus={getSessionStatus}
            inputValue={inputValue}
            onInputChange={onInputChange}
            onSubmitCommand={onSubmitCommand}
          />
        </div>
      </div>
    );
  }

  return null;
};
