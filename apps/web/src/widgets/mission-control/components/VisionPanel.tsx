import React from 'react';
import { useVisionStore } from '../stores/visionStore';
import { Eye, FileText, Scan, CheckCircle2 } from 'lucide-react';

export const VisionPanel: React.FC = () => {
  const { analysis, analyzeScreen } = useVisionStore();

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">
              VISION & OCR INTELLIGENCE ENGINE
            </h3>
            <span className="text-[9px] font-mono text-emerald-400 block">
              CONFIDENCE SCORE: {analysis.confidenceScore}%
            </span>
          </div>
        </div>

        <button
          onClick={() => analyzeScreen()}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-[10px] font-mono font-medium flex items-center space-x-1 transition-colors"
        >
          <Scan className="w-3 h-3 text-cyan-400" />
          <span>Analyze Screen</span>
        </button>
      </div>

      {/* Screen Summary Card */}
      <div className="p-2.5 rounded-xl bg-[#070914] border border-white/10 space-y-1 font-mono text-xs">
        <span className="text-[8.5px] text-white/40 block">SCREEN ANALYSIS SUMMARY</span>
        <p className="text-[10.5px] text-white/90 font-semibold">{analysis.screenSummary}</p>

        <div className="flex items-center space-x-3 pt-1 border-t border-white/5 text-[9px] text-white/60">
          <span>Buttons: <strong className="text-emerald-400">{analysis.buttonsCount}</strong></span>
          <span>Windows: <strong className="text-purple-400">{analysis.windowsCount}</strong></span>
          <span>Charts: <strong className="text-pink-400">{analysis.chartsCount}</strong></span>
        </div>
      </div>

      {/* Detected OCR Text Feed */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex items-center space-x-1 text-[9.5px] text-white/50">
          <FileText className="w-3 h-3 text-amber-400" />
          <span>DETECTED OCR TEXT STRINGS</span>
        </div>

        <div className="space-y-1 max-h-28 overflow-y-auto pr-1 hide-scrollbar">
          {analysis.ocrTextList.map((txt, i) => (
            <div key={i} className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-[9.5px] text-white/80 flex items-center justify-between">
              <span className="truncate max-w-[240px]">• {txt}</span>
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
