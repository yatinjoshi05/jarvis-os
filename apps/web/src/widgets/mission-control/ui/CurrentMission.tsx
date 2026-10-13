import React from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import { Target, Clock, Users, Play, Pause } from 'lucide-react';

export const CurrentMission: React.FC = () => {
  const { currentMission, stopMission, startMission } = useMissionControlStore();

  const isRunning = currentMission.status === 'IN_PROGRESS';

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-xl shadow-xl relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-purple-600/10 via-cyan-500/10 to-transparent blur-2xl pointer-events-none" />

      {/* Mission Title Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10 font-sans">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-md">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-[#00DFFF] font-bold tracking-wider uppercase">
                CURRENT OPERATIONAL MISSION
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono">
                {currentMission.status}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              {currentMission.title}
            </h2>
          </div>
        </div>

        {/* Toggle Controls */}
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <button
              onClick={stopMission}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-mono text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={() => startMission()}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-emerald-300" />
              <span>Resume</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Stats */}
      <div className="space-y-2 relative z-10 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/70">Execution Progress</span>
          <span className="text-[#00DFFF] font-bold">{currentMission.progress}%</span>
        </div>

        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${currentMission.progress}%` }}
          />
        </div>
      </div>

      {/* Assigned Agents & Deadline */}
      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3 relative z-10 font-mono text-xs text-white/80">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-purple-400 shrink-0" />
          <div>
            <span className="text-[10px] text-white/40 block">TARGET DEADLINE</span>
            <span className="font-semibold text-white">{currentMission.deadline}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-white/40 block">ASSIGNED AGENTS</span>
            <div className="flex items-center space-x-1">
              {currentMission.assignedAgents.map((ag) => (
                <span key={ag} className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-cyan-300 border border-white/5">
                  {ag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
