import React from 'react';
import { useAppPreviewStore } from '../../model/useAppPreviewStore';
import { Monitor, Minus, Square, X, Cpu, Layers } from 'lucide-react';

export const DesktopWindowFrame: React.FC = () => {
  const { inspectorData, runningPort } = useAppPreviewStore();

  const appUrl = `http://localhost:${runningPort || 1420}/`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#05060A] p-4 relative select-none overflow-hidden font-sans">
      {/* Native Desktop Window Frame Container */}
      <div className="w-full max-w-4xl h-[480px] bg-[#0C0E1A] border border-white/10 rounded-xl shadow-2xl flex flex-col relative overflow-hidden shadow-purple-500/10">
        {/* Desktop Titlebar Controls */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#101222] border-b border-white/10 text-xs font-mono text-white/80">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-[9px]">
              T
            </div>
            <span className="font-bold text-white text-[11px]">{inspectorData.framework} Desktop App</span>
          </div>

          <div className="flex items-center space-x-2 text-[9px] text-white/40">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-emerald-400">
              ● RUNNING (:1420)
            </span>

            {/* Window Controls */}
            <div className="flex items-center space-x-1 pl-2">
              <button className="p-1 hover:bg-white/10 rounded text-white/60">
                <Minus className="w-2.5 h-2.5" />
              </button>
              <button className="p-1 hover:bg-white/10 rounded text-white/60">
                <Square className="w-2.5 h-2.5" />
              </button>
              <button className="p-1 hover:bg-rose-500/20 rounded text-rose-400">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Desktop Application Window Content */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#07080F]">
          <iframe
            src={appUrl}
            title="JARVIS Desktop App Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />

          {/* Desktop Application Fallback Preview Canvas */}
          <div className="absolute inset-0 bg-[#07080F] p-6 flex flex-col justify-between text-white pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {inspectorData.framework} Window Surface
                </h1>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                  Native Process ID: 14092
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono text-[10px]">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center space-x-1 text-white/50">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>Backend Process</span>
                  </div>
                  <div className="text-white font-bold">{inspectorData.entryFile}</div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center space-x-1 text-white/50">
                    <Layers className="w-3 h-3 text-pink-400" />
                    <span>Build Execution</span>
                  </div>
                  <div className="text-white font-bold">{inspectorData.buildTimeMs} ms</div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center space-x-1 text-white/50">
                    <Monitor className="w-3 h-3 text-emerald-400" />
                    <span>Dependencies</span>
                  </div>
                  <div className="text-white font-bold">{inspectorData.dependenciesCount} modules</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-mono text-white/40">
              <span>Tauri / Electron Desktop Subsystem</span>
              <span>IPC Tunnel Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
