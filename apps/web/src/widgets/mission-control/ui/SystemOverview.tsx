import React from 'react';
import { Activity, Brain, FileCheck, HardDrive, Users } from 'lucide-react';

export const SystemOverview: React.FC = () => {
  return (
    <div className="grid grid-cols-5 gap-3 font-sans">
      {/* 1. Running Tasks */}
      <div className="p-3.5 rounded-2xl bg-[#0B0D1B]/90 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg hover:border-purple-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/50 uppercase">Running Tasks</span>
          <Activity className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-white">12</span>
          <span className="text-[9px] font-mono text-emerald-400">● 100% OK</span>
        </div>
      </div>

      {/* 2. AI Decisions */}
      <div className="p-3.5 rounded-2xl bg-[#0B0D1B]/90 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/50 uppercase">AI Decisions</span>
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-[#00DFFF]">1,420</span>
          <span className="text-[9px] font-mono text-cyan-400">Autopilot</span>
        </div>
      </div>

      {/* 3. Files Processed */}
      <div className="p-3.5 rounded-2xl bg-[#0B0D1B]/90 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg hover:border-pink-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/50 uppercase">Files Processed</span>
          <FileCheck className="w-3.5 h-3.5 text-pink-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-white">384</span>
          <span className="text-[9px] font-mono text-pink-400">Indexed</span>
        </div>
      </div>

      {/* 4. Memory Usage */}
      <div className="p-3.5 rounded-2xl bg-[#0B0D1B]/90 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/50 uppercase">Memory Allocation</span>
          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-white">38%</span>
          <span className="text-[9px] font-mono text-amber-300">2.4 GB</span>
        </div>
      </div>

      {/* 5. Agents Online */}
      <div className="p-3.5 rounded-2xl bg-[#0B0D1B]/90 border border-white/10 space-y-2 backdrop-blur-xl shadow-lg hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-white/50 uppercase">Agents Online</span>
          <Users className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-extrabold text-emerald-400">5 / 5</span>
          <span className="text-[9px] font-mono text-emerald-400">Active</span>
        </div>
      </div>
    </div>
  );
};
