import React from 'react';
import { AgentDetails } from '../services/AgentCoordinator';
import { Cpu, HardDrive, Globe, Mic, Database, Eye, Zap, Terminal, Folder, Search, Play, Square, RefreshCw } from 'lucide-react';
import { useAgentStore } from '../stores/agentStore';

interface AgentCardProps {
  agent: AgentDetails;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const { startAgent, stopAgent, restartAgent } = useAgentStore();

  const getAgentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'browser agent':
        return <Globe className="w-4 h-4 text-pink-400" />;
      case 'voice agent':
        return <Mic className="w-4 h-4 text-cyan-400" />;
      case 'memory agent':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'vision agent':
        return <Eye className="w-4 h-4 text-amber-400" />;
      case 'automation agent':
        return <Zap className="w-4 h-4 text-[#00DFFF]" />;
      case 'terminal agent':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'file agent':
        return <Folder className="w-4 h-4 text-blue-400" />;
      default:
        return <Search className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'working':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8.5px] font-mono flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>WORKING</span>
          </span>
        );
      case 'idle':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[8.5px] font-mono">IDLE</span>;
      case 'paused':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[8.5px] font-mono">PAUSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[8.5px] font-mono">OFFLINE</span>;
    }
  };

  return (
    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all font-mono text-xs flex flex-col justify-between space-y-2 select-none shadow-md">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getAgentIcon(agent.name)}
            <h4 className="font-bold text-[11px] text-white truncate">{agent.name}</h4>
          </div>
          {getStatusBadge(agent.state)}
        </div>

        <p className="text-[9.5px] font-sans text-white/60 line-clamp-1">{agent.currentTask}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[9px] text-white/60">
        <div className="flex items-center space-x-1">
          <Cpu className="w-2.5 h-2.5 text-purple-400" />
          <span>CPU {agent.cpuUsage}%</span>
        </div>
        <div className="flex items-center space-x-1">
          <HardDrive className="w-2.5 h-2.5 text-pink-400" />
          <span>{agent.memoryMb} MB</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center space-x-1 text-[8.5px]">
          {agent.state === 'working' ? (
            <button onClick={() => stopAgent(agent.id)} className="p-1 hover:bg-white/10 rounded text-rose-400" title="Pause Agent">
              <Square className="w-2.5 h-2.5 fill-rose-400" />
            </button>
          ) : (
            <button onClick={() => startAgent(agent.id)} className="p-1 hover:bg-white/10 rounded text-emerald-400" title="Start Agent">
              <Play className="w-2.5 h-2.5 fill-emerald-400" />
            </button>
          )}
          <button onClick={() => restartAgent(agent.id)} className="p-1 hover:bg-white/10 rounded text-cyan-400" title="Restart Agent">
            <RefreshCw className="w-2.5 h-2.5" />
          </button>
        </div>
        <span className="text-[8px] text-white/30">Uptime: {Math.round(agent.uptimeSeconds / 3600)}h</span>
      </div>
    </div>
  );
};
