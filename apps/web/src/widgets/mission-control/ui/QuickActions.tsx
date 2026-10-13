import React from 'react';
import { useMissionControlStore } from '../model/missionControlStore';
import { Play, Plus, Terminal, Globe, Camera, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const { startMission, createTask, addTimelineEvent } = useMissionControlStore();
  const navigate = useNavigate();

  const handleStartMission = () => {
    startMission('JARVIS Mission Control Operation');
    addTimelineEvent('New mission initialized from Mission Control', 'mission');
  };

  const handleCreateTask = () => {
    createTask('Perform neural network sanity check');
    addTimelineEvent('Task created: Neural network sanity check', 'system');
  };

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl">
      <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase">
        QUICK ACTIONS
      </h3>

      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
        {/* Start Mission */}
        <button
          onClick={handleStartMission}
          className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/30 text-white font-semibold flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
        >
          <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
          <span>Start Mission</span>
        </button>

        {/* Create Task */}
        <button
          onClick={handleCreateTask}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-medium flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span>Create Task</span>
        </button>

        {/* Open Terminal */}
        <button
          onClick={() => {
            addTimelineEvent('Terminal workspace navigated', 'system');
            navigate('/terminal');
          }}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-medium flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Open Terminal</span>
        </button>

        {/* Open Browser */}
        <button
          onClick={() => {
            addTimelineEvent('Browser workspace navigated', 'browser');
            navigate('/browser');
          }}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-medium flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
        >
          <Globe className="w-3.5 h-3.5 text-pink-400" />
          <span>Open Browser</span>
        </button>

        {/* Take Screenshot */}
        <button
          onClick={() => addTimelineEvent('Screenshot captured & saved to files', 'file')}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-medium flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Screenshot</span>
        </button>

        {/* Start Voice Mode */}
        <button
          onClick={() => addTimelineEvent('Voice listener activated', 'voice')}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 font-medium flex items-center space-x-2 transition-all transform hover:scale-[1.02]"
        >
          <Mic className="w-3.5 h-3.5 text-[#00DFFF]" />
          <span>Voice Mode</span>
        </button>
      </div>
    </div>
  );
};
