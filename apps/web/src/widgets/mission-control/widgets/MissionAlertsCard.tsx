import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, Globe, Zap, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'MISSION_COMPLETED' | 'BROWSER_READY' | 'AUTOMATION_FINISHED' | 'ERROR_DETECTED';
  title: string;
  detail: string;
  time: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const initialAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    type: 'MISSION_COMPLETED',
    title: 'Mission Completed',
    detail: 'Autonomous code audit pipeline finished with 0 errors.',
    time: 'Just now',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'alert-2',
    type: 'BROWSER_READY',
    title: 'Browser Ready',
    detail: 'Headless DOM analyzer initialized on port 9222.',
    time: '1m ago',
    icon: Globe,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  {
    id: 'alert-3',
    type: 'AUTOMATION_FINISHED',
    title: 'Automation Finished',
    detail: 'Scheduled backup cron job executed successfully.',
    time: '4m ago',
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 'alert-4',
    type: 'ERROR_DETECTED',
    title: 'Errors Detected',
    detail: 'Rate limit warning on external provider endpoint.',
    time: '8m ago',
    icon: AlertTriangle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
];

const alertTemplates: Omit<AlertItem, 'id' | 'time'>[] = [
  {
    type: 'MISSION_COMPLETED',
    title: 'Mission Completed',
    detail: 'Vector index optimization workflow finished.',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    type: 'BROWSER_READY',
    title: 'Browser Ready',
    detail: 'Puppeteer DOM parser session attached.',
    icon: Globe,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  {
    type: 'AUTOMATION_FINISHED',
    title: 'Automation Finished',
    detail: 'Telemetry reporting cron dispatched.',
    icon: Zap,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    type: 'ERROR_DETECTED',
    title: 'Errors Detected',
    detail: 'High CPU load warning on background task #89.',
    icon: AlertTriangle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
];

export const MissionAlertsCard: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [isLive, setIsLive] = useState(true);

  // Automatically insert new alerts periodically to demonstrate the notification feed animation
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const randomTemplate = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      const newAlert: AlertItem = {
        ...randomTemplate,
        id: `alert-${Date.now()}`,
        time: 'Just now',
      };

      setAlerts((prev) => [newAlert, ...prev.slice(0, 3)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isLive]);

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const triggerSimulatedAlert = () => {
    const randomTemplate = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
    const newAlert: AlertItem = {
      ...randomTemplate,
      id: `alert-${Date.now()}`,
      time: 'Just now',
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 3)]);
  };

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d18]/80 p-5 backdrop-blur-xl shadow-xl hover:border-purple-500/40 transition-all duration-500 group"
      whileHover={{ y: -3 }}
    >
      {/* Neon Background Blur */}
      <div className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl group-hover:bg-pink-500/20 transition-all duration-700 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <Bell className="h-4 w-4 animate-bounce" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide font-sans">Mission Alerts</h3>
            <span className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono text-purple-300">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
              Live Stream
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
            Mission completed, browser ready, automation finished, errors detected.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={triggerSimulatedAlert}
            title="Simulate New Alert"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-purple-500/40 hover:bg-purple-500/10 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsLive(!isLive)}
            title={isLive ? 'Pause Stream' : 'Resume Stream'}
            className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${
              isLive
                ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            {isLive ? 'PAUSE' : 'RESUME'}
          </button>
        </div>
      </div>

      {/* Animated Notification Feed Stack */}
      <div className="relative min-h-[220px] flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {alerts.map((alert) => {
            const IconComp = alert.icon;
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`relative flex items-center justify-between rounded-xl border ${alert.borderColor} ${alert.bgColor} p-3 backdrop-blur-md transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${alert.bgColor} ${alert.color}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-white font-sans">{alert.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">• {alert.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5 line-clamp-1">{alert.detail}</p>
                  </div>
                </div>

                <button
                  onClick={() => removeAlert(alert.id)}
                  className="text-slate-500 hover:text-slate-200 transition-colors p-1"
                  title="Dismiss Alert"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Status Bar */}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-purple-400">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          Event Bus Dispatcher Active
        </span>
        <span className="text-slate-500">{alerts.length} Notifications Active</span>
      </div>
    </motion.div>
  );
};
