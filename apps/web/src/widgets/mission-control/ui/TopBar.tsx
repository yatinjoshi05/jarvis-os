import React, { useState, useEffect } from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import {
  Search,
  Cpu,
  HardDrive,
  Wifi,
  Battery,
  Bell,
  User,
  Shield,
  Clock,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { systemHealth, notificationsCount } = useMissionControlStore();
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full h-14 bg-[#0A0C16]/90 border-b border-white/10 px-4 flex items-center justify-between select-none backdrop-blur-xl shadow-lg relative z-30 font-sans">
      {/* Left: JARVIS Logo & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/20">
          <Shield className="w-4 h-4 text-white animate-pulse" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              JARVIS OS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
              v2.4 CORE
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/40 block">MISSION CONTROL SYSTEM</span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-6 relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-white/40" />
        <input
          type="text"
          placeholder="Search missions, tools, memory, or ask JARVIS..."
          className="w-full bg-[#121526] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors shadow-inner"
        />
      </div>

      {/* Right Metrics & Profile */}
      <div className="flex items-center space-x-4 text-xs font-mono text-white/80">
        {/* Clock */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-white text-xs">{timeString || '12:00:00 PM'}</span>
        </div>

        {/* CPU */}
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>CPU {systemHealth.cpu}%</span>
        </div>

        {/* RAM */}
        <div className="flex items-center space-x-1.5">
          <HardDrive className="w-3.5 h-3.5 text-pink-400" />
          <span>RAM {systemHealth.ram}%</span>
        </div>

        {/* Network */}
        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px]">
          <Wifi className="w-3 h-3" />
          <span>{systemHealth.network}</span>
        </div>

        {/* Battery */}
        <div className="flex items-center space-x-1 text-white/60">
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
          <span>98%</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors">
          <Bell className="w-4 h-4" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          )}
        </button>

        {/* Profile Menu */}
        <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center border border-white/20">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
