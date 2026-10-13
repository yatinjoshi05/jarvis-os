import React from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import { VoiceWidget } from '../widgets/VoiceWidget';
import { MemoryWidget } from '../widgets/MemoryWidget';
import { WorkflowPanel } from '../components/WorkflowPanel';

export const RightPanel: React.FC = () => {
  const { upcomingActions } = useMissionControlStore();

  const getActionBadge = (category: string) => {
    switch (category) {
      case 'Scheduled':
        return <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[8px] font-mono">SCHEDULED</span>;
      case 'Automation':
        return <span className="px-2 py-0.5 rounded-full bg-[#00DFFF]/10 border border-[#00DFFF]/30 text-[#00DFFF] text-[8px] font-mono">AUTOMATION</span>;
      case 'Reminder':
        return <span className="px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[8px] font-mono">REMINDER</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[8px] font-mono">PENDING</span>;
    }
  };

  return (
    <aside className="w-full h-full flex flex-col space-y-4 overflow-y-auto hide-scrollbar select-none pl-1">
      {/* 1. Voice Integration Widget */}
      <VoiceWidget />

      {/* 2. Workflow Automation Engine Panel */}
      <WorkflowPanel />

      {/* 3. Neural Memory Engine Widget */}
      <MemoryWidget />

      {/* 4. Upcoming Actions List */}
      <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans flex-1">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
            UPCOMING ACTIONS
          </h3>
          <span className="text-[10px] font-mono text-white/40">{upcomingActions.length} PENDING</span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {upcomingActions.map((act) => (
            <div
              key={act.id}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                {getActionBadge(act.category)}
                <span className="text-[9px] text-white/50">{act.time}</span>
              </div>
              <p className="text-[10.5px] font-semibold text-white/90 truncate">{act.title}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
