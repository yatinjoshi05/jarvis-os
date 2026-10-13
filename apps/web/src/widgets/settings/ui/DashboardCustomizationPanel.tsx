import React, { useState } from 'react';
import { LayoutGrid, Check, Eye, EyeOff, Save } from 'lucide-react';

export interface WidgetVisibilityState {
  missions: boolean;
  memory: boolean;
  files: boolean;
  calendar: boolean;
  devices: boolean;
  advisor: boolean;
  crm: boolean;
}

export const DashboardCustomizationPanel: React.FC = () => {
  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibilityState>(() => {
    try {
      const stored = localStorage.getItem('jarvis_widget_visibility');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return {
      missions: true,
      memory: true,
      files: true,
      calendar: true,
      devices: true,
      advisor: true,
      crm: true,
    };
  });

  const [density, setDensity] = useState<'compact' | 'spacious'>(() => {
    try {
      return (localStorage.getItem('jarvis_dashboard_density') as any) || 'compact';
    } catch (_) {
      return 'compact';
    }
  });

  const [defaultWorkspace, setDefaultWorkspace] = useState<string>(() => {
    try {
      return localStorage.getItem('jarvis_default_workspace') || 'home';
    } catch (_) {
      return 'home';
    }
  });

  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  const toggleWidget = (id: keyof WidgetVisibilityState) => {
    const updated = { ...widgetVisibility, [id]: !widgetVisibility[id] };
    setWidgetVisibility(updated);
    localStorage.setItem('jarvis_widget_visibility', JSON.stringify(updated));
  };

  const handleDensityChange = (val: 'compact' | 'spacious') => {
    setDensity(val);
    localStorage.setItem('jarvis_dashboard_density', val);
  };

  const handleWorkspaceChange = (val: string) => {
    setDefaultWorkspace(val);
    localStorage.setItem('jarvis_default_workspace', val);
  };

  const handleApplyDashboard = async () => {
    setIsApplying(true);
    setApplyFeedback(null);
    try {
      await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardLayout: {
            widgetVisibility,
            density,
            defaultWorkspace,
          },
          timestamp: Date.now(),
        }),
      });
      setApplyFeedback('DASHBOARD MATRIX APPLIED & PERSISTED');
      setTimeout(() => setApplyFeedback(null), 2500);
    } catch (_) {
      setApplyFeedback('SAVED LOCALLY');
      setTimeout(() => setApplyFeedback(null), 2500);
    } finally {
      setIsApplying(false);
    }
  };

  const widgetsList: { id: keyof WidgetVisibilityState; label: string; desc: string }[] = [
    { id: 'missions', label: 'Missions Panel', desc: 'Active autonomous agent goals & tasks' },
    { id: 'memory', label: 'Memory Logs', desc: 'Long-term associative vector memory feeds' },
    { id: 'files', label: 'Recent Files', desc: 'Telemetry of recent sandboxed code edits' },
    { id: 'calendar', label: 'Calendar Schedule', desc: 'Scheduled cron tasks & system reminders' },
    { id: 'devices', label: 'Devices Tray', desc: 'Connected local hardware & IoT devices' },
    { id: 'advisor', label: 'AI Advisor', desc: 'Proactive recommendations & system alerts' },
    { id: 'crm', label: 'CRM Telemetry', desc: 'User relationship & interaction metrics' },
  ];

  return (
    <div className="w-full bg-black/40 border border-white/10 rounded-xl p-5 space-y-6 font-mono select-none text-left relative z-10">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <LayoutGrid size={16} className="text-[#FF0055]" />
          <h3 className="text-xs font-black text-white uppercase tracking-wider">
            Workspace Matrix & Dashboard Layout
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {applyFeedback && (
            <span className="text-[8.5px] font-bold text-[#00FFCC] border border-[#00FFCC]/30 bg-[#00FFCC]/10 px-2 py-0.5 rounded flex items-center space-x-1 uppercase">
              <Check size={9} />
              <span>{applyFeedback}</span>
            </span>
          )}
          <button
            onClick={handleApplyDashboard}
            disabled={isApplying}
            className="px-3 py-1.5 bg-[#FF0055] hover:bg-[#E0004B] text-white rounded text-[9px] font-bold uppercase transition-all flex items-center space-x-1 disabled:opacity-50"
          >
            <Save size={10} />
            <span>{isApplying ? 'APPLYING...' : 'APPLY MATRIX LAYOUT'}</span>
          </button>
        </div>
      </div>

      {/* WIDGET VISIBILITY MATRIX TOGGLES */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-[#FF0055] uppercase tracking-wider">
            [1] WORKSPACE MATRIX WIDGET TOGGLES
          </span>
          <span className="text-[8px] text-white/40 font-mono">
            {Object.values(widgetVisibility).filter(Boolean).length} / {widgetsList.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {widgetsList.map((w) => {
            const isVisible = widgetVisibility[w.id];
            return (
              <div
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isVisible
                    ? 'border-white/20 bg-white/5 hover:border-[#FF0055]/50'
                    : 'border-white/5 bg-black/40 opacity-50 hover:opacity-80'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <span className="text-[10px] font-bold text-white uppercase">{w.label}</span>
                  <p className="text-[7.5px] text-white/50">{w.desc}</p>
                </div>
                <button
                  type="button"
                  className={`p-1.5 rounded border transition-colors ${
                    isVisible
                      ? 'bg-[#FF0055]/20 text-[#FF0055] border-[#FF0055]/40'
                      : 'bg-white/5 text-white/30 border-white/10'
                  }`}
                >
                  {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* DENSITY MODE & DEFAULT WORKSPACE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* DENSITY MODE */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
          <span className="text-[9px] font-black text-white uppercase tracking-wider">[2] DENSITY MODE</span>
          <p className="text-[8px] text-white/50">Adjust padding and information density across panels.</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'compact', label: 'COMPACT', desc: 'High density, minimal margins' },
              { id: 'spacious', label: 'SPACIOUS', desc: 'Generous padding & spacing' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => handleDensityChange(d.id as any)}
                className={`p-2.5 rounded-lg border text-left flex flex-col space-y-1 transition-all ${
                  density === d.id
                    ? 'border-[#00DFFF] bg-[#00DFFF]/10 text-white'
                    : 'border-white/10 bg-black/40 text-white/50 hover:text-white'
                }`}
              >
                <span className="text-[9px] font-black uppercase">{d.label}</span>
                <span className="text-[7px] text-white/40">{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DEFAULT STARTUP WORKSPACE */}
        <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
          <span className="text-[9px] font-black text-white uppercase tracking-wider">
            [3] DEFAULT STARTUP VIEW
          </span>
          <p className="text-[8px] text-white/50">Select landing workspace when initializing JARVIS OS.</p>

          <select
            value={defaultWorkspace}
            onChange={(e) => handleWorkspaceChange(e.target.value)}
            className="w-full bg-black/90 border border-white/20 rounded-lg p-2 text-[9.5px] text-white font-mono outline-none focus:border-[#00DFFF]"
          >
            <option value="home">Home / Primary Command Dashboard</option>
            <option value="chat">Voice & Text AI Assistant Workspace</option>
            <option value="coding">Coding & System Development Sandbox</option>
            <option value="financial">Financial Market & Trading Intelligence</option>
            <option value="crm">CRM & Communication Telemetry</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizationPanel;
