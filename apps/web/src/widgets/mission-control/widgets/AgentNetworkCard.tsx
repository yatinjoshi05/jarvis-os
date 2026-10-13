import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Globe, Database, Eye, Zap, Cpu, Activity, Radio } from 'lucide-react';

interface AgentNode {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  glowColor: string;
  packetsCount: number;
}

const agents: AgentNode[] = [
  {
    id: 'voice',
    name: 'Voice Agent',
    role: 'Speech & Audio',
    icon: Mic,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    glowColor: '#10b981',
    packetsCount: 42,
  },
  {
    id: 'browser',
    name: 'Browser Agent',
    role: 'Web DOM & Scraping',
    icon: Globe,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    glowColor: '#00f0ff',
    packetsCount: 89,
  },
  {
    id: 'memory',
    name: 'Memory Agent',
    role: 'Vector & Context',
    icon: Database,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    glowColor: '#a855f7',
    packetsCount: 156,
  },
  {
    id: 'vision',
    name: 'Vision Agent',
    role: 'OCR & Image Multi-modal',
    icon: Eye,
    color: 'text-pink-400',
    borderColor: 'border-pink-500/40',
    glowColor: '#ec4899',
    packetsCount: 31,
  },
  {
    id: 'automation',
    name: 'Automation Agent',
    role: 'Cron & Script Workflows',
    icon: Zap,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    glowColor: '#f59e0b',
    packetsCount: 64,
  },
];

export const AgentNetworkCard: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(agents[1]);

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0d18]/80 p-5 backdrop-blur-xl shadow-xl hover:border-cyan-500/40 transition-all duration-500 group"
      whileHover={{ y: -3 }}
    >
      {/* Background Cyber Glow */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide font-sans">Agent Network</h3>
            <span className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> Swarm Topology
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-sans leading-relaxed">
            Visualize communication between Voice, Browser, Memory, Vision, and Automation Agents.
          </p>
        </div>
      </div>

      {/* Integration Rail SVG Canvas Animation */}
      <div className="relative h-64 w-full flex items-center justify-center border border-white/5 bg-[#070914]/90 rounded-xl p-4 overflow-hidden mb-3">
        {/* Connection Rail Vector Network SVG */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          <defs>
            <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Central Hub to 5 Surrounding Agents Connecting SVG Lines */}
          <path d="M 50% 50% L 20% 25%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 50% 50% L 80% 25%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 50% 50% L 15% 75%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 50% 50% L 85% 75%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M 50% 50% L 50% 88%" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Moving Animated Data Packets along the Integration Rails */}
          {/* Packet 1: Voice -> Hub */}
          <motion.circle
            r="3.5"
            fill="#10b981"
            animate={{
              cx: ['20%', '50%'],
              cy: ['25%', '50%'],
              opacity: [0, 1, 0],
            }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
          />

          {/* Packet 2: Hub -> Browser */}
          <motion.circle
            r="3.5"
            fill="#00f0ff"
            animate={{
              cx: ['50%', '80%'],
              cy: ['50%', '25%'],
              opacity: [0, 1, 0],
            }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: 'linear' }}
          />

          {/* Packet 3: Memory -> Hub */}
          <motion.circle
            r="3.5"
            fill="#a855f7"
            animate={{
              cx: ['15%', '50%'],
              cy: ['75%', '50%'],
              opacity: [0, 1, 0],
            }}
            transition={{ repeat: Infinity, duration: 2.6, delay: 0.8, ease: 'linear' }}
          />

          {/* Packet 4: Hub -> Vision */}
          <motion.circle
            r="3.5"
            fill="#ec4899"
            animate={{
              cx: ['50%', '85%'],
              cy: ['50%', '75%'],
              opacity: [0, 1, 0],
            }}
            transition={{ repeat: Infinity, duration: 2.1, delay: 0.2, ease: 'linear' }}
          />

          {/* Packet 5: Automation -> Hub */}
          <motion.circle
            r="3.5"
            fill="#f59e0b"
            animate={{
              cx: ['50%', '50%'],
              cy: ['88%', '50%'],
              opacity: [0, 1, 0],
            }}
            transition={{ repeat: Infinity, duration: 1.9, delay: 1.1, ease: 'linear' }}
          />
        </svg>

        {/* Central Hub Core Node */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="absolute z-20 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/50 bg-[#0d1326]/90 shadow-[0_0_25px_rgba(0,240,255,0.4)] backdrop-blur-xl"
        >
          <Cpu className="h-6 w-6 text-cyan-400 animate-pulse" />
        </motion.div>

        {/* 5 Surrounding Agent Nodes Positioned on Rail Nodes */}

        {/* Node 1: Voice Agent (Top-Left 20%, 25%) */}
        <motion.button
          onClick={() => setSelectedAgent(agents[0])}
          whileHover={{ scale: 1.15 }}
          className={`absolute top-[18%] left-[12%] z-20 flex items-center gap-2 rounded-xl border p-2 backdrop-blur-md transition-all ${
            selectedAgent?.id === 'voice'
              ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'border-white/10 bg-[#0a0e1c]/80 text-slate-300 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Mic className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white pr-1">Voice</span>
        </motion.button>

        {/* Node 2: Browser Agent (Top-Right 80%, 25%) */}
        <motion.button
          onClick={() => setSelectedAgent(agents[1])}
          whileHover={{ scale: 1.15 }}
          className={`absolute top-[18%] right-[12%] z-20 flex items-center gap-2 rounded-xl border p-2 backdrop-blur-md transition-all ${
            selectedAgent?.id === 'browser'
              ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
              : 'border-white/10 bg-[#0a0e1c]/80 text-slate-300 hover:border-cyan-500/50'
          }`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white pr-1">Browser</span>
        </motion.button>

        {/* Node 3: Memory Agent (Bottom-Left 15%, 75%) */}
        <motion.button
          onClick={() => setSelectedAgent(agents[2])}
          whileHover={{ scale: 1.15 }}
          className={`absolute bottom-[18%] left-[10%] z-20 flex items-center gap-2 rounded-xl border p-2 backdrop-blur-md transition-all ${
            selectedAgent?.id === 'memory'
              ? 'border-purple-400 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'border-white/10 bg-[#0a0e1c]/80 text-slate-300 hover:border-purple-500/50'
          }`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
            <Database className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white pr-1">Memory</span>
        </motion.button>

        {/* Node 4: Vision Agent (Bottom-Right 85%, 75%) */}
        <motion.button
          onClick={() => setSelectedAgent(agents[3])}
          whileHover={{ scale: 1.15 }}
          className={`absolute bottom-[18%] right-[10%] z-20 flex items-center gap-2 rounded-xl border p-2 backdrop-blur-md transition-all ${
            selectedAgent?.id === 'vision'
              ? 'border-pink-400 bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
              : 'border-white/10 bg-[#0a0e1c]/80 text-slate-300 hover:border-pink-500/50'
          }`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
            <Eye className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white pr-1">Vision</span>
        </motion.button>

        {/* Node 5: Automation Agent (Bottom-Center 50%, 88%) */}
        <motion.button
          onClick={() => setSelectedAgent(agents[4])}
          whileHover={{ scale: 1.15 }}
          className={`absolute bottom-[5%] left-[34%] z-20 flex items-center gap-2 rounded-xl border p-2 backdrop-blur-md transition-all ${
            selectedAgent?.id === 'automation'
              ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'border-white/10 bg-[#0a0e1c]/80 text-slate-300 hover:border-amber-500/50'
          }`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold text-white pr-1">Automation</span>
        </motion.button>
      </div>

      {/* Selected Agent Telemetry Display */}
      {selectedAgent && (
        <div className="rounded-xl border border-white/10 bg-[#0c1022]/90 p-3 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 ${selectedAgent.color}`}>
              <selectedAgent.icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-sans">{selectedAgent.name}</h4>
              <p className="text-[10px] text-slate-400 font-mono">{selectedAgent.role}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {selectedAgent.packetsCount} Packets / sec
            </span>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
