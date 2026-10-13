import React from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import { Brain, MessageSquare, Key, Pin } from 'lucide-react';

export const MemorySummary: React.FC = () => {
  const { memorySummary } = useMissionControlStore();

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase flex items-center space-x-1.5">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span>MEMORY SUMMARY</span>
        </h3>
        <span className="text-[10px] font-mono text-purple-300">VECTOR INDEXED</span>
      </div>

      <div className="space-y-3 text-xs">
        {/* Recent Conversations */}
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center space-x-1.5 text-white/50 text-[10px]">
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span>RECENT CONVERSATIONS</span>
          </div>

          <div className="space-y-1">
            {memorySummary.recentConversations.map((c, i) => (
              <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 text-[10.5px] text-white/80 line-clamp-1 hover:border-white/20 transition-all">
                • {c}
              </div>
            ))}
          </div>
        </div>

        {/* Important Facts */}
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center space-x-1.5 text-white/50 text-[10px]">
            <Key className="w-3 h-3 text-amber-400" />
            <span>IMPORTANT FACTS</span>
          </div>

          <div className="space-y-1">
            {memorySummary.importantFacts.map((f, i) => (
              <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 text-[10.5px] text-white/80 line-clamp-1 hover:border-white/20 transition-all">
                • {f}
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Memories */}
        <div className="space-y-1.5 font-mono">
          <div className="flex items-center space-x-1.5 text-white/50 text-[10px]">
            <Pin className="w-3 h-3 text-pink-400" />
            <span>PINNED MEMORIES</span>
          </div>

          <div className="space-y-1">
            {memorySummary.pinnedMemories.map((p, i) => (
              <div key={i} className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[10.5px] text-pink-200 line-clamp-1 hover:border-pink-500/40 transition-all">
                📌 {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
