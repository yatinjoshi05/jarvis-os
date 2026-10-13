import React from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import { Cpu, CheckCircle2, Clock } from 'lucide-react';

export const AgentStatus: React.FC = () => {
  const { agents } = useMissionControlStore();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>WORKING</span>
          </span>
        );
      case 'waiting':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono flex items-center space-x-1">
            <Clock className="w-2.5 h-2.5" />
            <span>WAITING</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] font-mono">
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
          AGENT COORDINATION MATRIX
        </h3>
        <span className="text-[10px] font-mono text-emerald-400">5 AGENTS ONLINE</span>
      </div>

      <div className="grid grid-cols-5 gap-2.5 font-mono text-xs">
        {agents.map((ag) => (
          <div
            key={ag.id}
            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                {getStatusBadge(ag.status)}
              </div>
              <h4 className="font-extrabold text-[11px] text-white truncate">{ag.name}</h4>
              <p className="text-[9px] text-white/50 leading-tight font-sans line-clamp-2">{ag.role}</p>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8.5px] text-white/40">
              <span>IPC Connected</span>
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
