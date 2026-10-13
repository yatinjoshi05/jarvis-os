import React from 'react';
import { Globe, Eye, Database, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export const AgentGraph: React.FC = () => {
  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
          LIVE AGENT EXECUTION DEPENDENCY GRAPH
        </h3>
        <span className="text-[9px] font-mono text-emerald-400">ACTIVE CONNECTIONS: 4</span>
      </div>

      {/* Connection Flow Graph Nodes */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#070914] border border-white/10 font-mono text-xs overflow-x-auto hide-scrollbar">
        {/* Node 1: Browser Agent */}
        <div className="flex flex-col items-center p-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-center min-w-[90px]">
          <Globe className="w-4 h-4 text-pink-400 mb-1" />
          <span className="text-[10px] font-bold text-white">Browser Agent</span>
          <span className="text-[8px] text-pink-300">Step 1: Capture</span>
        </div>

        <ArrowRight className="w-4 h-4 text-white/30 shrink-0 mx-1 animate-pulse" />

        {/* Node 2: Vision Agent */}
        <div className="flex flex-col items-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center min-w-[90px]">
          <Eye className="w-4 h-4 text-amber-400 mb-1" />
          <span className="text-[10px] font-bold text-white">Vision Agent</span>
          <span className="text-[8px] text-amber-300">Step 2: OCR</span>
        </div>

        <ArrowRight className="w-4 h-4 text-white/30 shrink-0 mx-1 animate-pulse" />

        {/* Node 3: Memory Agent */}
        <div className="flex flex-col items-center p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center min-w-[90px]">
          <Database className="w-4 h-4 text-purple-400 mb-1" />
          <span className="text-[10px] font-bold text-white">Memory Agent</span>
          <span className="text-[8px] text-purple-300">Step 3: Index</span>
        </div>

        <ArrowRight className="w-4 h-4 text-white/30 shrink-0 mx-1 animate-pulse" />

        {/* Node 4: Automation Agent */}
        <div className="flex flex-col items-center p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center min-w-[90px]">
          <Zap className="w-4 h-4 text-[#00DFFF] mb-1" />
          <span className="text-[10px] font-bold text-white">Automation</span>
          <span className="text-[8px] text-cyan-300">Step 4: Execute</span>
        </div>

        <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mx-1" />

        {/* Node 5: Result */}
        <div className="flex flex-col items-center p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center min-w-[90px]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-[10px] font-bold text-emerald-300">Mission OK</span>
          <span className="text-[8px] text-emerald-400">120ms</span>
        </div>
      </div>
    </div>
  );
};
