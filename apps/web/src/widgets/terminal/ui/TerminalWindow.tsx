import React, { useRef, useEffect } from 'react';
import { TerminalLineItem, TerminalVisualState } from '../types';
import { TerminalLine } from './TerminalLine';

interface TerminalWindowProps {
  lines: TerminalLineItem[];
  currentPromptPath?: string;
  inputValue: string;
  onInputChange: (val: string) => void;
  onSubmitCommand: (cmd: string) => void;
  visualState?: TerminalVisualState;
  isSplitView?: boolean;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  lines,
  currentPromptPath = 'C:\\Users\\Yatin>',
  inputValue,
  onInputChange,
  onSubmitCommand,
  visualState = 'idle',
  isSplitView = false,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmitCommand(inputValue);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 p-2.5 font-mono overflow-y-auto hide-scrollbar bg-[#050508] text-white/90 text-[11px] select-text ${
        isSplitView ? 'border-r border-white/10' : ''
      }`}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 50% 0%, rgba(0, 223, 255, 0.03) 0%, rgba(0, 0, 0, 0) 70%)',
      }}
    >
      {/* Visual State Indicator Pill (if executing/error/warning) */}
      {visualState !== 'idle' && (
        <div className="absolute top-2 right-3 z-10 flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[9px] uppercase font-mono tracking-wider">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              visualState === 'executing'
                ? 'bg-[#00DFFF] animate-ping'
                : visualState === 'success'
                ? 'bg-green-400'
                : visualState === 'error'
                ? 'bg-red-400'
                : 'bg-yellow-400'
            }`}
          />
          <span className="text-white/70">{visualState}</span>
        </div>
      )}

      {/* Rendered Terminal Lines */}
      <div className="space-y-0.5">
        {lines.map((line) => (
          <TerminalLine key={line.id} line={line} />
        ))}
      </div>

      {/* Interactive Active Prompt Line */}
      <div className="flex items-center space-x-1.5 font-mono mt-1.5 py-0.5 relative text-[11px]">
        <span className="text-[#00DFFF] font-semibold whitespace-nowrap">{currentPromptPath}</span>
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-transparent text-[#EC4899] font-medium text-[11px] focus:outline-none caret-transparent"
            spellCheck={false}
          />
          {/* Custom Cyberpunk Blinking Block Cursor */}
          <span
            className="absolute text-[#00DFFF] font-bold pointer-events-none animate-pulse text-[11px]"
            style={{
              left: `${inputValue.length * 6.8}px`,
            }}
          >
            █
          </span>
        </div>
      </div>

      <div ref={endRef} />
    </div>
  );
};
