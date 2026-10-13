import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Play, Plus, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduledTask {
  id: string;
  day: number;
  time: string;
  title: string;
  cron: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED';
  categoryColor: string;
}

const initialTasks: ScheduledTask[] = [
  { id: 't1', day: 3, time: '09:00 AM', title: 'System Health & Disk Cleanup', cron: '0 9 * * 1-5', status: 'COMPLETED', categoryColor: 'bg-emerald-500' },
  { id: 't2', day: 8, time: '01:30 PM', title: 'Web Scraper Vector Sync', cron: '*/30 * * * *', status: 'RUNNING', categoryColor: 'bg-cyan-500' },
  { id: 't3', day: 15, time: '04:00 PM', title: 'Autonomous Code Audit Task', cron: '0 16 * * *', status: 'PENDING', categoryColor: 'bg-purple-500' },
  { id: 't4', day: 22, time: '11:00 PM', title: 'Database Cold Storage Backup', cron: '0 23 * * 0', status: 'PENDING', categoryColor: 'bg-pink-500' },
];

export const AutomationSchedulerCard: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(8);
  const [tasks] = useState<ScheduledTask[]>(initialTasks);
  const currentMonth = 'JULY 2026';

  // Generate 28 calendar days for the visual month grid
  const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1);

  const activeTaskForSelectedDay = tasks.find((t) => t.day === selectedDay);

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d18]/80 p-5 backdrop-blur-xl shadow-xl hover:border-emerald-500/40 transition-all duration-500 group"
      whileHover={{ y: -3 }}
    >
      {/* Background Neon Blur */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl group-hover:bg-teal-500/20 transition-all duration-700 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide font-sans">Automation Scheduler</h3>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
              <Clock className="h-2.5 w-2.5" /> 4 Active Jobs
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
            Schedule workflows, reminders, and recurring tasks.
          </p>
        </div>

        <button
          title="Create New Workflow Schedule"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Month Selector Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <span className="text-xs font-mono font-bold tracking-widest text-emerald-400">{currentMonth}</span>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Animated Interactive Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayName, idx) => (
          <div key={idx} className="text-center text-[10px] font-mono text-slate-500 font-bold mb-1">
            {dayName}
          </div>
        ))}

        {calendarDays.map((dayNum) => {
          const taskOnDay = tasks.find((t) => t.day === dayNum);
          const isSelected = selectedDay === dayNum;

          return (
            <motion.button
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center justify-center h-8 rounded-lg font-mono text-xs transition-all duration-200 ${
                isSelected
                  ? 'border border-emerald-400 bg-emerald-500/20 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : taskOnDay
                  ? 'border border-white/20 bg-white/5 text-slate-200 hover:border-emerald-500/50'
                  : 'border border-transparent bg-white/[0.02] text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              <span>{dayNum}</span>

              {/* Pulsing indicator dot for days with scheduled automation tasks */}
              {taskOnDay && (
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${taskOnDay.categoryColor}`}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Task Details Display Panel */}
      <div className="rounded-xl border border-white/10 bg-[#0c1022]/90 p-3 backdrop-blur-md">
        {activeTaskForSelectedDay ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${activeTaskForSelectedDay.categoryColor}`} />
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                  {activeTaskForSelectedDay.cron}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{activeTaskForSelectedDay.time}</span>
            </div>

            <h4 className="text-xs font-semibold text-white font-sans">{activeTaskForSelectedDay.title}</h4>

            <div className="mt-2 flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                Status:{' '}
                <span
                  className={
                    activeTaskForSelectedDay.status === 'RUNNING'
                      ? 'text-cyan-400 animate-pulse'
                      : activeTaskForSelectedDay.status === 'COMPLETED'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }
                >
                  {activeTaskForSelectedDay.status}
                </span>
              </span>

              <button className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors">
                <Play className="h-3 w-3" /> Run Now
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono py-1">
            <span>No automation task scheduled for Day {selectedDay}</span>
            <button className="text-emerald-400 hover:underline text-[11px]">+ Add Job</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Cron Scheduler Active
        </span>
        <span className="text-slate-500">Next trigger in 14m</span>
      </div>
    </motion.div>
  );
};
