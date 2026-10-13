import React from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import { QuickActions } from './QuickActions';
import {
  User,
  ShieldCheck,
  Cpu,
  HardDrive,
  Database,
  Wifi,
  Globe,
  Mic,
  Eye,
  Zap,
  Terminal,
  Folder,
} from 'lucide-react';

export const LeftSidebar: React.FC = () => {
  const { systemHealth, activeModules } = useMissionControlStore();

  const getModuleIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'browser':
        return <Globe className="w-3.5 h-3.5 text-pink-400" />;
      case 'voice':
        return <Mic className="w-3.5 h-3.5 text-cyan-400" />;
      case 'memory':
        return <Database className="w-3.5 h-3.5 text-purple-400" />;
      case 'vision':
        return <Eye className="w-3.5 h-3.5 text-amber-400" />;
      case 'automation':
        return <Zap className="w-3.5 h-3.5 text-[#00DFFF]" />;
      case 'terminal':
        return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Folder className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-mono">ACTIVE ●</span>;
      case 'sleeping':
        return <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[8px] font-mono">SLEEPING</span>;
      case 'loading':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[8px] font-mono animate-pulse">LOADING</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[8px] font-mono">ERROR</span>;
    }
  };

  return (
    <aside className="w-full h-full flex flex-col space-y-4 overflow-y-auto hide-scrollbar select-none pr-1">
      {/* 1. User Profile Card */}
      <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 flex items-center space-x-3 backdrop-blur-xl shadow-xl">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center border border-white/20 shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B0D1B] absolute -bottom-0.5 -right-0.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <h2 className="font-extrabold text-xs text-white truncate">Commander H</h2>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <span className="text-[10px] font-mono text-emerald-400 block font-semibold">
            SYSTEM ROOT ACCESS
          </span>
        </div>
      </div>

      {/* 2. System Status Panel */}
      <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
          SYSTEM STATUS
        </h3>

        <div className="space-y-2.5 text-xs font-mono">
          {/* CPU */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center space-x-1.5 text-white/70">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>CPU Load</span>
              </span>
              <span className="text-purple-300 font-bold">{systemHealth.cpu}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${systemHealth.cpu}%` }} />
            </div>
          </div>

          {/* RAM */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center space-x-1.5 text-white/70">
                <HardDrive className="w-3 h-3 text-pink-400" />
                <span>RAM Usage</span>
              </span>
              <span className="text-pink-300 font-bold">{systemHealth.ram}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" style={{ width: `${systemHealth.ram}%` }} />
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="flex items-center space-x-1.5 text-white/70">
                <Database className="w-3 h-3 text-cyan-400" />
                <span>Storage</span>
              </span>
              <span className="text-cyan-300 font-bold">{systemHealth.storage}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${systemHealth.storage}%` }} />
            </div>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
            <span className="flex items-center space-x-1.5 text-white/70">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Network State</span>
            </span>
            <span className="text-emerald-400 font-bold">{systemHealth.network}</span>
          </div>
        </div>
      </div>

      {/* 3. Active Modules Panel */}
      <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl flex-1">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
          ACTIVE MODULES
        </h3>

        <div className="space-y-2">
          {activeModules.map((mod) => (
            <div
              key={mod.id}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all"
            >
              <div className="flex items-center space-x-2">
                {getModuleIcon(mod.name)}
                <span className="text-[11px] font-semibold text-white/90">{mod.name}</span>
              </div>
              {getStatusBadge(mod.status)}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick Actions Panel */}
      <QuickActions />
    </aside>
  );
};
