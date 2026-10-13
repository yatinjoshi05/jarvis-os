import React, { useRef, useState } from 'react';
import { useBrowserStore } from '../model/useBrowserStore';
import { BrowserPreviewPanel } from './BrowserPreviewPanel';
import { BrowserAIChatPanel } from './BrowserAIChatPanel';
import { BrowserStatusBar } from './BrowserStatusBar';
import { ArrowLeftRight } from 'lucide-react';

export default function BrowserPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rightPanelWidth, setRightPanelWidth } = useBrowserStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - moveEvent.clientX;
      setRightPanelWidth(newWidth);
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
    <div className="flex-1 flex flex-col h-full w-full bg-[#050508] select-none overflow-hidden">
      {/* Main 2-Panel Resizable Container */}
      <div
        ref={containerRef}
        className="flex-1 flex w-full min-h-0 overflow-hidden p-2.5 gap-2 relative"
      >
        {/* Left Panel: Browser Preview Panel */}
        <div className="flex-1 flex min-w-[320px] min-h-0 overflow-hidden">
          <BrowserPreviewPanel />
        </div>

        {/* Resizable Vertical Divider Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`group z-30 flex items-center justify-center w-1.5 cursor-col-resize select-none relative transition-colors ${
            isDragging
              ? 'bg-[#00DFFF] shadow-[0_0_10px_#00DFFF]'
              : 'hover:bg-[#EC4899] bg-white/5 hover:shadow-[0_0_8px_rgba(236,72,153,0.5)]'
          }`}
        >
          {/* Circular Neon Handle Button (Scaled Down) */}
          <div
            className={`w-5 h-5 rounded-full bg-[#0D0E17] border flex items-center justify-center text-[9px] transition-all transform group-hover:scale-110 shadow-md ${
              isDragging
                ? 'border-[#00DFFF] text-[#00DFFF] shadow-[0_0_8px_#00DFFF]'
                : 'border-white/20 group-hover:border-[#EC4899] text-white/60 group-hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Right Panel: AI Chat Panel */}
        <div
          style={{ width: `${rightPanelWidth}px` }}
          className="flex flex-col min-h-0 shrink-0 overflow-hidden transition-all duration-75"
        >
          <BrowserAIChatPanel />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <BrowserStatusBar />
    </div>
  );
}
