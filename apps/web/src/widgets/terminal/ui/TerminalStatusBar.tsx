import React from 'react';
import { TerminalShellType } from '../types';
import { Cpu, Wifi, Activity } from 'lucide-react';

interface TerminalStatusBarProps {
  shellType?: TerminalShellType;
  cwd?: string;
  isOnline?: boolean;
  statusState?: string;
}

export const TerminalStatusBar: React.FC<TerminalStatusBarProps> = ({
  shellType = 'powershell',
  cwd = 'C:\\Users\\Yatin',
  isOnline = true,
  statusState = 'IDLE',
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-0.5 bg-[#090A0E] border-t border-white/10 text-[10px] font-mono text-white/50 select-none">
      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-1 text-[#00DFFF]">
          <span className="w-1 h-1 rounded-full bg-[#00DFFF] animate-pulse" />
          <span className="capitalize">{shellType}</span>
        </span>
        <span className="hidden sm:inline text-white/40">{cwd}</span>
      </div>

      <div className="flex items-center space-x-3">
        <span className="flex items-center space-x-1">
          <Activity className="w-2.5 h-2.5 text-[#00DFFF]" />
          <span className="text-[#00DFFF] font-bold uppercase">{statusState}</span>
        </span>

        <span className="flex items-center space-x-1">
          <Cpu className="w-2.5 h-2.5 text-white/40" />
          <span>RAM 27%</span>
        </span>

        <span className="flex items-center space-x-1">
          <Wifi className="w-2.5 h-2.5 text-green-400" />
          <span className="text-green-400 font-semibold">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </span>

        <span className="hidden md:inline text-white/30">UTF-8</span>
      </div>
    </div>
  );
};
