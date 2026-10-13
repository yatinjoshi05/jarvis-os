import React, { useState } from 'react';
import { useMissionControlStore } from '../store/missionControlStore';
import { Brain, Search, Pin, Calendar, Database } from 'lucide-react';

export const MemoryWidget: React.FC = () => {
  const { memories, searchMemory } = useMissionControlStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMemories = searchQuery.trim() ? searchMemory(searchQuery) : memories;

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase flex items-center space-x-1.5">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span>NEURAL MEMORY ENGINE</span>
        </h3>
        <span className="text-[10px] font-mono text-purple-300">{memories.length} RECORDS INDEXED</span>
      </div>

      {/* Search Input Filter */}
      <div className="relative flex items-center">
        <Search className="w-3 h-3 absolute left-2.5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search neural vector memory index..."
          className="w-full bg-[#121526] border border-white/10 rounded-xl pl-8 pr-3 py-1 text-[10px] font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors"
        />
      </div>

      {/* Memory Cards Stream */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 hide-scrollbar font-mono text-xs">
        {filteredMemories.map((mem) => (
          <div
            key={mem.id}
            className={`p-2.5 rounded-xl border transition-all ${mem.pinned ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                {mem.pinned && <Pin className="w-3 h-3 text-pink-400 fill-pink-400" />}
                <h4 className="font-bold text-[11px] text-white truncate max-w-[200px]">{mem.title}</h4>
              </div>

              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${mem.importance === 'HIGH' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/50'}`}>
                {mem.importance}
              </span>
            </div>

            <p className="text-[9.5px] font-sans text-white/70 mt-1 leading-tight line-clamp-2">{mem.content}</p>

            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[8.5px] text-white/40">
              <span className="flex items-center space-x-1">
                <Database className="w-2.5 h-2.5 text-cyan-400" />
                <span>{mem.source}</span>
              </span>

              <div className="flex items-center space-x-1">
                <Calendar className="w-2.5 h-2.5" />
                <span>{mem.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
