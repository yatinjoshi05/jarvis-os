import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Code2, FolderGit2, MessageSquare, Database, Sparkles, Layers } from 'lucide-react';

interface MemoryItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
  badge: string;
}

const memoryItems: MemoryItem[] = [
  {
    id: '1',
    type: 'CONVERSATIONS',
    title: 'Executive Session Context',
    detail: 'Hydrated 42 active conversation memory vectors',
    timestamp: '2 mins ago',
    icon: MessageSquare,
    color: 'from-cyan-500 to-blue-600',
    badge: '4.2 MB',
  },
  {
    id: '2',
    type: 'PROJECTS',
    title: 'JARVIS Architecture Blueprint',
    detail: 'Monorepo service dependency graph indexed',
    timestamp: '12 mins ago',
    icon: FolderGit2,
    color: 'from-purple-500 to-indigo-600',
    badge: '18 Files',
  },
  {
    id: '3',
    type: 'CODE SNAPSHOTS',
    title: 'AgentOrchestrator.ts #142',
    detail: 'Captured AST snapshot & tool permissions schema',
    timestamp: '1 hour ago',
    icon: Code2,
    color: 'from-pink-500 to-rose-600',
    badge: 'v2.4.0',
  },
  {
    id: '4',
    type: 'USER CONTEXT',
    title: 'Identity & Preference Matrix',
    detail: 'Dark theme, voice speed 1.1x, auto-approve read',
    timestamp: '3 hours ago',
    icon: Brain,
    color: 'from-emerald-400 to-teal-600',
    badge: '100% Synced',
  },
];

export const MemoryEngineCard: React.FC = () => {
  const [items, setItems] = useState<MemoryItem[]>(memoryItems);
  const [isHovered, setIsHovered] = useState(false);

  const cycleStack = () => {
    setItems((prev) => {
      const next = [...prev];
      const first = next.shift();
      if (first) next.push(first);
      return next;
    });
  };

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d18]/80 p-5 backdrop-blur-xl shadow-xl hover:border-cyan-500/40 transition-all duration-500 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -3 }}
    >
      {/* Background Neon Accent Glow */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700 pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Database className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide font-sans">Memory Engine</h3>
            <span className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
              <Sparkles className="h-2.5 w-2.5" /> 4,192 Nodes
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
            Stores conversations, projects, code snapshots, and user context.
          </p>
        </div>

        <button
          onClick={cycleStack}
          title="Cycle Memory Stack"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all"
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* 3D Animated File-Stack Container */}
      <div className="relative h-48 w-full mt-2 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => {
            // Index 0 is front card, 1 is middle, 2 is back, etc.
            const isFront = index === 0;
            const offsetScale = 1 - index * 0.05;
            const offsetTranslateY = index * 14;
            const offsetOpacity = 1 - index * 0.22;
            const offsetRotateX = isFront && isHovered ? -4 : 0;
            const offsetRotateZ = isFront && isHovered ? 1.5 : index % 2 === 0 ? index * 0.8 : index * -0.8;

            const IconComponent = item.icon;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{
                  scale: offsetScale,
                  y: offsetTranslateY,
                  opacity: offsetOpacity,
                  rotateX: offsetRotateX,
                  rotateZ: offsetRotateZ,
                  zIndex: items.length - index,
                }}
                exit={{
                  scale: 0.8,
                  y: -50,
                  opacity: 0,
                  rotateZ: -10,
                  transition: { duration: 0.35, ease: 'easeIn' },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 22,
                }}
                onClick={cycleStack}
                className={`absolute top-0 w-full cursor-pointer rounded-xl border p-3.5 backdrop-blur-md transition-all duration-300 ${
                  isFront
                    ? 'border-cyan-500/40 bg-[#0f1426]/90 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(0,240,255,0.15)] hover:border-cyan-400'
                    : 'border-white/10 bg-[#0b0e1d]/80 shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} text-white shadow-md`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">• {item.timestamp}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white font-sans truncate max-w-[200px]">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300">
                    {item.badge}
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-slate-400 font-mono truncate">
                  {item.detail}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Status Line */}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Neural Vector Store Active
        </span>
        <span className="text-slate-500 group-hover:text-slate-300 transition-colors">Click stack to cycle →</span>
      </div>
    </motion.div>
  );
};
