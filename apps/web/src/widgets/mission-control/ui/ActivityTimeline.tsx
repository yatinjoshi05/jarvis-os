import React from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import { Globe, Mic, FileText, Target, Upload, Activity } from 'lucide-react';

export const ActivityTimeline: React.FC = () => {
  const { timeline } = useMissionControlStore();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'browser':
        return <Globe className="w-3.5 h-3.5 text-pink-400" />;
      case 'voice':
        return <Mic className="w-3.5 h-3.5 text-cyan-400" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-orange-400" />;
      case 'mission':
        return <Target className="w-3.5 h-3.5 text-purple-400" />;
      case 'file':
        return <Upload className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl flex-1 flex flex-col font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
          ACTIVITY TIMELINE
        </h3>
        <span className="text-[10px] font-mono text-white/40">REALTIME TELEMETRY FEED</span>
      </div>

      {/* Timeline Stream Feed */}
      <div className="space-y-2 overflow-y-auto max-h-56 pr-1 hide-scrollbar font-mono text-xs">
        {timeline.map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all"
          >
            {/* Event Icon */}
            <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0">
              {getEventIcon(item.type)}
            </div>

            {/* Event Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/90 truncate">{item.message}</p>
            </div>

            {/* Time Badge */}
            <span className="text-[10px] font-mono text-[#00DFFF] bg-[#00DFFF]/10 border border-[#00DFFF]/30 px-2 py-0.5 rounded-md shrink-0">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
