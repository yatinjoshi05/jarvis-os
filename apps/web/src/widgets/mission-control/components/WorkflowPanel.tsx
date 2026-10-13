import React from 'react';
import { useAutomationStore } from '../stores/automationStore';
import { Zap, Play, Clock, CheckCircle2 } from 'lucide-react';

export const WorkflowPanel: React.FC = () => {
  const { workflows, runWorkflow, pauseWorkflow } = useAutomationStore();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8.5px] font-mono flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>RUNNING</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[8.5px] font-mono flex items-center space-x-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>COMPLETED</span>
          </span>
        );
      case 'paused':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[8.5px] font-mono">PAUSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[8.5px] font-mono">QUEUED</span>;
    }
  };

  return (
    <div className="bg-[#0B0D1B]/90 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-xl font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold font-mono tracking-wider text-[#00DFFF] uppercase flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-[#00DFFF]" />
          <span>WORKFLOW AUTOMATION ENGINE</span>
        </h3>
        <span className="text-[10px] font-mono text-cyan-300">{workflows.length} WORKFLOWS</span>
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 hide-scrollbar font-mono text-xs">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-[11px] text-white truncate max-w-[200px]">{wf.name}</h4>
                <span className="text-[8.5px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                  {wf.trigger}
                </span>
              </div>
              {getStatusBadge(wf.status)}
            </div>

            {/* Action Steps Pill Row */}
            <div className="flex flex-wrap gap-1">
              {wf.steps.map((st) => (
                <span
                  key={st.id}
                  className={`px-1.5 py-0.5 rounded text-[8px] border ${st.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/5 text-white/50'}`}
                >
                  {st.type}: {st.target}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] text-white/50">
              <div className="flex items-center space-x-1">
                <Clock className="w-2.5 h-2.5" />
                <span>Last run: {wf.lastRunTime || 'Never'}</span>
              </div>

              {wf.status === 'running' ? (
                <button onClick={() => pauseWorkflow(wf.id)} className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30">
                  Pause
                </button>
              ) : (
                <button onClick={() => runWorkflow(wf.id)} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center space-x-1">
                  <Play className="w-2.5 h-2.5 fill-emerald-300" />
                  <span>Run</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
