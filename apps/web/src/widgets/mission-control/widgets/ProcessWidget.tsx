import React from 'react';
import { useMissionControlStore } from '../store/missionControlStore';
import { Cpu, HardDrive, PlayCircle } from 'lucide-react';

export const ProcessWidget: React.FC = () => {
  const { activeProcesses } = useMissionControlStore();

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase flex items-center space-x-1.5">
          <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>ACTIVE KERNEL PROCESSES</span>
        </h3>
        <span className="text-[10px] font-mono text-emerald-400">{activeProcesses.length} RUNNING</span>
      </div>

      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 hide-scrollbar font-mono text-[10px]">
        {activeProcesses.map((proc) => (
          <div
            key={proc.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all"
          >
            <span className="font-semibold text-white/90 truncate max-w-[140px]">{proc.name}</span>

            <div className="flex items-center space-x-3 text-white/60">
              <span className="flex items-center space-x-1">
                <Cpu className="w-2.5 h-2.5 text-purple-400" />
                <span className="text-purple-300 font-bold">{proc.cpu}%</span>
              </span>

              <span className="flex items-center space-x-1">
                <HardDrive className="w-2.5 h-2.5 text-pink-400" />
                <span className="text-pink-300 font-bold">{proc.memoryMb} MB</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
