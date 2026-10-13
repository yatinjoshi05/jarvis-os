import React from 'react';
import { useMissionControlStore } from '../store/missionControlStore';
import { Cpu, HardDrive, Database, ShieldCheck, AlertTriangle, XCircle, Thermometer, Wifi } from 'lucide-react';

export const SystemHealthWidget: React.FC = () => {
  const { systemMetrics } = useMissionControlStore();

  const getHealthBadge = () => {
    switch (systemMetrics.healthState) {
      case 'Healthy':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
            <ShieldCheck className="w-3 h-3" />
            <span>HEALTHY</span>
          </div>
        );
      case 'Warning':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING</span>
          </div>
        );
      case 'Critical':
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] animate-pulse">
            <XCircle className="w-3 h-3" />
            <span>CRITICAL</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-mono text-[10px]">
            <span>OFFLINE</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
          SYSTEM HEALTH INTELLIGENCE
        </h3>
        {getHealthBadge()}
      </div>

      <div className="grid grid-cols-4 gap-2 font-mono text-xs">
        {/* CPU */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span className="flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-purple-400" />
              <span>CPU</span>
            </span>
            <span className="text-purple-300 font-bold">{systemMetrics.cpu}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${systemMetrics.cpu}%` }} />
          </div>
        </div>

        {/* RAM */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span className="flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-pink-400" />
              <span>RAM</span>
            </span>
            <span className="text-pink-300 font-bold">{systemMetrics.ram}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${systemMetrics.ram}%` }} />
          </div>
        </div>

        {/* GPU */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span className="flex items-center space-x-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>GPU</span>
            </span>
            <span className="text-cyan-300 font-bold">{systemMetrics.gpu}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${systemMetrics.gpu}%` }} />
          </div>
        </div>

        {/* TEMP & NET */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[9px] text-white/60">
            <span className="flex items-center space-x-1">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>TEMP</span>
            </span>
            <span className="text-amber-300 font-bold">{systemMetrics.temperatureC}°C</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-white/60">
            <span className="flex items-center space-x-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>NET</span>
            </span>
            <span className="text-emerald-300 font-bold">{systemMetrics.networkSpeedMb} MB/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
