import React from 'react';
import { useAppPreviewStore } from '../../model/useAppPreviewStore';
import { Sparkles, CheckCircle2, Play } from 'lucide-react';

export const PrototypeViewer: React.FC = () => {
  const { inspectorData } = useAppPreviewStore();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#07080F] p-6 relative select-none overflow-hidden font-sans">
      {/* UI Prototype & Generated Project Canvas */}
      <div className="w-full max-w-4xl min-h-[440px] bg-[#0E101F]/90 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Radial Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-purple-500/20 via-pink-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Prototype Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white tracking-tight">
                Generated Project: Spotify Clone & Music Player UI
              </h2>
              <span className="text-[10px] font-mono text-white/50">UI Design Prototype • Built by JARVIS</span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Auto-Generated Preview Ready</span>
          </span>
        </div>

        {/* Mock Spotify Clone Generated Interface */}
        <div className="bg-[#121528] border border-white/10 rounded-xl p-4 space-y-4 relative z-10 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-xs">
                <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
              </div>
              <span className="font-bold text-xs text-white">Spotify Clone Player</span>
            </div>
            <span className="text-[9px] font-mono text-white/40">React + Tailwind UI</span>
          </div>

          {/* Music Track Grid Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
              <div className="w-full h-20 rounded bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-xs">
                🎵 Track #1
              </div>
              <div className="text-[10px] font-semibold text-white">Neon Cyberpunk Synthwave</div>
              <div className="text-[8px] font-mono text-white/40">JARVIS Audio Engine</div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
              <div className="w-full h-20 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xs">
                🎹 Track #2
              </div>
              <div className="text-[10px] font-semibold text-white">Ambient Neural Beats</div>
              <div className="text-[8px] font-mono text-white/40">JARVIS Audio Engine</div>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
              <div className="w-full h-20 rounded bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center font-bold text-xs">
                🎧 Track #3
              </div>
              <div className="text-[10px] font-semibold text-white">Quantum Pulse Lofi</div>
              <div className="text-[8px] font-mono text-white/40">JARVIS Audio Engine</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-mono text-white/40 relative z-10">
          <span>Project Path: {inspectorData.entryFile}</span>
          <span>HMR Hot Reload Active</span>
        </div>
      </div>
    </div>
  );
};
