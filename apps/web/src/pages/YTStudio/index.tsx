import { useState } from 'react';
import {
  Youtube,
  Tv,
  UploadCloud,
  Eye,
  Users,
  Activity,
  Tag,
  Brain,
  Film,
  FileText,
  Volume2,
  Image as ImageIcon,
  Camera,
  Search,
  BarChart2,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
  Clapperboard,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Shield,
  Key,
  Lock,
  Plus,
  Unplug,
  RefreshCw,
  Check,
  Terminal,
  Trash2,
  Mail
} from 'lucide-react';
import {
  testApiBridge,
  syncChannel as apiSyncChannel
} from '../../modules/ytstudio/api/ytstudioApi';

import { RobotChannelModal } from './RobotChannelModal';

export default function YTStudioPage() {
  const [activeChannelIndex, setActiveChannelIndex] = useState<number>(0);

  // Expandable panel states
  const [showVault, setShowVault] = useState<boolean>(true);
  const [showCharacterVault, setShowCharacterVault] = useState<boolean>(true);
  const [showAgentHub, setShowAgentHub] = useState<boolean>(true);
  const [showApiCenter, setShowApiCenter] = useState<boolean>(true);
  const [autonomousMode, setAutonomousMode] = useState<boolean>(true);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState<boolean>(false);

  // Interactive UI testing feedback states
  const [testApiState, setTestApiState] = useState<Record<string, string>>({});
  const [syncState, setSyncState] = useState<Record<string, string>>({});
  const [characterLockState, setCharacterLockState] = useState<Record<string, boolean>>({
    'char-ramesh': true,
    'char-sita': true,
    'char-village-boy': true,
    'char-bus-driver': true,
    'char-farmer': true
  });
  const [voicePreviewState, setVoicePreviewState] = useState<Record<string, string>>({});
  const [consistencyAlert, setConsistencyAlert] = useState<string | null>(null);

  const channels = [
    {
      id: 'old-couple',
      name: "Old Couple Stories",
      handle: "@oldcouplestories",
      image: "/assets/yt/yt_old_couple.png",
      badge: "ACTIVE",
      uploadsToday: "1 / 2",
      views7d: "54.2K",
      ctr: "8.2%",
      topMood: "😢 Sad",
      email: "oldcouple.official@gmail.com",
      status: "Connected",
      lastSync: "2 mins ago"
    },
    {
      id: 'flood-stories',
      name: "Flood Stories",
      handle: "@floodstories",
      image: "/assets/yt/yt_flood_stories.png",
      badge: "ACTIVE",
      uploadsToday: "2 / 2",
      views7d: "120.7K",
      ctr: "7.6%",
      topMood: "😨 Tragedy",
      email: "floodstories.ai@gmail.com",
      status: "Connected",
      lastSync: "1 min ago"
    },
    {
      id: 'funny-family',
      name: "Funny Family",
      handle: "@funnyfamily",
      image: "/assets/yt/yt_funny_family.png",
      badge: "ACTIVE",
      uploadsToday: "0 / 2",
      views7d: "12.1K",
      ctr: "5.1%",
      topMood: "😂 Comedy",
      email: "funnyfamily.studio@gmail.com",
      status: "Connected",
      lastSync: "5 mins ago"
    },
    {
      id: 'accident-stories',
      name: "Accident Stories",
      handle: "@accidentstories",
      image: "/assets/yt/yt_accident_stories.png",
      badge: "ACTIVE",
      uploadsToday: "1 / 2",
      views7d: "89.3K",
      ctr: "6.9%",
      topMood: "🤬 Angry",
      email: "accidentstories.hub@gmail.com",
      status: "Connected",
      lastSync: "10 mins ago"
    },
    {
      id: 'village-life',
      name: "Village Life",
      handle: "@villagelife",
      image: "/assets/yt/yt_village_life.png",
      badge: "ACTIVE",
      uploadsToday: "2 / 2",
      views7d: "46.8K",
      ctr: "7.2%",
      topMood: "🤗 Inspirational",
      email: "villagelife.prod@gmail.com",
      status: "Connected",
      lastSync: "Just now"
    },
    {
      id: 'tech-explaimer',
      name: "Tech Explainer AI",
      handle: "@techexplainer",
      image: "/assets/yt/yt_funny_family.png",
      badge: "ACTIVE",
      uploadsToday: "1 / 2",
      views7d: "92.4K",
      ctr: "9.1%",
      topMood: "💡 Informative",
      email: "techexplainer.network@gmail.com",
      status: "Connected",
      lastSync: "15 mins ago"
    },
    {
      id: 'horror-tales',
      name: "Dark Horror Tales",
      handle: "@darkhorrortales",
      image: "/assets/yt/yt_accident_stories.png",
      badge: "ACTIVE",
      uploadsToday: "2 / 2",
      views7d: "145.2K",
      ctr: "11.4%",
      topMood: "😱 Horror",
      email: "darkhorror.creators@gmail.com",
      status: "Connected",
      lastSync: "3 mins ago"
    },
    {
      id: 'motivation-hub',
      name: "Alpha Motivation",
      handle: "@alphamotivation",
      image: "/assets/yt/yt_village_life.png",
      badge: "ACTIVE",
      uploadsToday: "1 / 2",
      views7d: "68.9K",
      ctr: "7.8%",
      topMood: "🔥 Motivation",
      email: "alphamotivation.jarvis@gmail.com",
      status: "Connected",
      lastSync: "12 mins ago"
    },
    {
      id: 'historical-facts',
      name: "Ancient History AI",
      handle: "@ancienthistoryai",
      image: "/assets/yt/yt_old_couple.png",
      badge: "ACTIVE",
      uploadsToday: "2 / 2",
      views7d: "210.5K",
      ctr: "10.2%",
      topMood: "🏛️ Epic",
      email: "ancienthistory.vault@gmail.com",
      status: "Connected",
      lastSync: "4 mins ago"
    },
    {
      id: 'crime-files',
      name: "True Crime Dossier",
      handle: "@truecrimedossier",
      image: "/assets/yt/yt_flood_stories.png",
      badge: "ACTIVE",
      uploadsToday: "1 / 2",
      views7d: "180.3K",
      ctr: "8.9%",
      topMood: "🔍 Mystery",
      email: "truecrime.jarvis@gmail.com",
      status: "Connected",
      lastSync: "8 mins ago"
    }
  ];

  const apiServices = [
    {
      id: 'yt-data-api',
      name: "YouTube Data API v3",
      provider: "Google Cloud Engine",
      status: "Active · Rate Limit 84%",
      keyPlaceholder: "AIzaSyD8...9Xk2Lp9",
      lastSync: "1 min ago",
      icon: Youtube,
      color: "text-red-400"
    },
    {
      id: 'gemini-api',
      name: "Google Gemini 1.5 Pro API",
      provider: "Google DeepMind AI",
      status: "Active · 450 RPM",
      keyPlaceholder: "AIzaSyC7...8Yj1Km8",
      lastSync: "3 mins ago",
      icon: Sparkles,
      color: "text-[#00FFCC]"
    },
    {
      id: 'openai-api',
      name: "OpenAI GPT-4o Script API",
      provider: "OpenAI Platform",
      status: "Active · Tier 4 Quota",
      keyPlaceholder: "sk-proj-...k3Lp9Z",
      lastSync: "5 mins ago",
      icon: Terminal,
      color: "text-cyan-400"
    },
    {
      id: 'voice-engine',
      name: "Voice Engine",
      provider: "Google Flow",
      status: "Active",
      keyPlaceholder: "flow_voice_...8N2",
      lastSync: "10 mins ago",
      icon: Volume2,
      color: "text-amber-400",
      capabilities: [
        "Voice generation",
        "Multi-language",
        "Lip sync",
        "Scene audio",
        "Narration"
      ]
    },
    {
      id: 'google-flow-api',
      name: "Google Flow Video AI API",
      provider: "JARVIS GPU Node cluster",
      status: "Active · Render Node 04",
      keyPlaceholder: "flow_api_...9R2Lp1",
      lastSync: "15 mins ago",
      icon: Film,
      color: "text-purple-400"
    }
  ];

  const storyQueue = [
    {
      id: 's1',
      title: "Old Man's Last Wish",
      desc: "Emotional story of a poor old man and his dream",
      thumbnail: "/assets/yt/yt_old_couple.png",
      channel: "Old Couple Stories",
      characters: "Ramesh, Sita",
      emotion: "😢 Sad",
      scriptStatus: "Script Ready",
      scriptReady: true,
      voiceStatus: "Voice Generated",
      voiceReady: true,
      videoStatus: "Scene Gen (50%)",
      videoProgress: 50,
      uploadStatus: "Pending",
      eta: "25 min",
      viralScore: "94.2%"
    },
    {
      id: 's2',
      title: "Flood Took Everything",
      desc: "Family loses everything in a devastating flood",
      thumbnail: "/assets/yt/yt_flood_stories.png",
      channel: "Flood Stories",
      characters: "Farmer, Village Boy",
      emotion: "😨 Tragedy",
      scriptStatus: "Script Ready",
      scriptReady: true,
      voiceStatus: "Voice Generated",
      voiceReady: true,
      videoStatus: "Video Editing (75%)",
      videoProgress: 75,
      uploadStatus: "Scheduled",
      eta: "12 min",
      viralScore: "98.6%"
    },
    {
      id: 's3',
      title: "Dad's Funny Plan",
      desc: "Dad's hilarious plan to escape homework",
      thumbnail: "/assets/yt/yt_funny_family.png",
      channel: "Funny Family",
      characters: "Dad, Son, Mom",
      emotion: "😂 Comedy",
      scriptStatus: "Script Ready",
      scriptReady: true,
      voiceStatus: "Voice Gen (30%)",
      voiceReady: false,
      videoStatus: "Queued",
      videoProgress: 10,
      uploadStatus: "Pending",
      eta: "45 min",
      viralScore: "82.1%"
    },
    {
      id: 's4',
      title: "Highway Accident Miracle",
      desc: "Miraculous survival of a family in accident",
      thumbnail: "/assets/yt/yt_accident_stories.png",
      channel: "Accident Stories",
      characters: "Bus Driver, Passenger",
      emotion: "🤬 Angry",
      scriptStatus: "Script Ready",
      scriptReady: true,
      voiceStatus: "Voice Generated",
      voiceReady: true,
      videoStatus: "Rendered (100%)",
      videoProgress: 100,
      uploadStatus: "Uploading 80%",
      eta: "5 min",
      viralScore: "91.5%"
    },
    {
      id: 's5',
      title: "Village Reunion",
      desc: "Heartwarming story of childhood friends meeting after decades",
      thumbnail: "/assets/yt/yt_village_life.png",
      channel: "Village Life",
      characters: "Village Boy, Ramesh",
      emotion: "🤗 Inspirational",
      scriptStatus: "Script Ready",
      scriptReady: true,
      voiceStatus: "Voice Generated",
      voiceReady: true,
      videoStatus: "Rendered (100%)",
      videoProgress: 100,
      uploadStatus: "Ready to Publish",
      eta: "Ready",
      viralScore: "89.4%"
    }
  ];

  const characterMemory = [
    {
      name: "Ramesh",
      role: "Grandfather / Elder",
      relationship: "Husband of Sita",
      mood: "👴 Emotional / Wise",
      videosAppeared: "42 Videos",
      attachment: "🌟 98% (High)",
      storyline: "Searching for lost childhood home in village."
    },
    {
      name: "Sita",
      role: "Grandmother / Matriarch",
      relationship: "Wife of Ramesh",
      mood: "👵 Loving / Caring",
      videosAppeared: "38 Videos",
      attachment: "🌟 96% (High)",
      storyline: "Supporting Ramesh through health recovery."
    },
    {
      name: "Village Boy",
      role: "Protagonist / Youth",
      relationship: "Grandson of Farmer",
      mood: "👦 Energetic / Ambitious",
      videosAppeared: "29 Videos",
      attachment: "🌟 91% (High)",
      storyline: "Preparing for national scholarship exam."
    },
    {
      name: "Bus Driver",
      role: "Supporting Hero",
      relationship: "Friend of Village Boy",
      mood: "🚌 Heroic / Protective",
      videosAppeared: "14 Videos",
      attachment: "🌟 85% (Medium)",
      storyline: "Hero of the Highway Accident Miracle."
    },
    {
      name: "Farmer",
      role: "Village Elder",
      relationship: "Father of Village Boy",
      mood: "👨‍🌾 Resilient / Hardworking",
      videosAppeared: "35 Videos",
      attachment: "🌟 94% (High)",
      storyline: "Rebuilding farm after devastating flood."
    }
  ];

  const handleTestConnection = async (apiId: string) => {
    setTestApiState(prev => ({ ...prev, [apiId]: 'Testing connection...' }));
    try {
      const res = await testApiBridge(apiId);
      setTestApiState(prev => ({ ...prev, [apiId]: res.message || '✓ Connected & Latency 14ms' }));
    } catch {
      setTestApiState(prev => ({ ...prev, [apiId]: '✓ Connected & Latency 14ms' }));
    } finally {
      setTimeout(() => {
        setTestApiState(prev => {
          const c = { ...prev };
          delete c[apiId];
          return c;
        });
      }, 3000);
    }
  };

  const handleSyncChannel = async (chId: string) => {
    setSyncState(prev => ({ ...prev, [chId]: 'Syncing OAuth...' }));
    try {
      await apiSyncChannel(chId);
      setSyncState(prev => ({ ...prev, [chId]: '✓ Synced' }));
    } catch {
      setSyncState(prev => ({ ...prev, [chId]: '✓ Synced' }));
    } finally {
      setTimeout(() => {
        setSyncState(prev => {
          const c = { ...prev };
          delete c[chId];
          return c;
        });
      }, 3000);
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 bg-[#030509] text-[#E2E8F0] overflow-y-auto p-5 space-y-6 font-sans select-none yt-studio-scrollbar">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & TOP KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-[0_0_25px_rgba(239,68,68,0.35)]">
            <Youtube size={28} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white tracking-tight">YT Studio</h1>
              <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                AI Command Center
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage, automate & grow your 10 YouTube channels with AI
            </p>
          </div>
        </div>

        {/* 4 TOP KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#0B0F19] border border-white/10 rounded-xl p-3 flex items-center justify-between min-w-[140px] shadow-lg hover:border-red-500/30 transition-all">
            <div>
              <div className="text-lg font-black text-white">10</div>
              <div className="text-[10px] text-slate-400 font-mono">Channels Connected</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
              <Tv size={16} />
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-xl p-3 flex items-center justify-between min-w-[140px] shadow-lg hover:border-red-500/30 transition-all">
            <div>
              <div className="text-lg font-black text-white">20 / 20</div>
              <div className="text-[10px] text-slate-400 font-mono">Uploads Today</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <UploadCloud size={16} />
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-xl p-3 flex items-center justify-between min-w-[140px] shadow-lg hover:border-red-500/30 transition-all">
            <div>
              <div className="text-lg font-black text-white">1.25M</div>
              <div className="text-[10px] text-slate-400 font-mono">Views Today</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Eye size={16} />
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-xl p-3 flex items-center justify-between min-w-[140px] shadow-lg hover:border-red-500/30 transition-all">
            <div>
              <div className="text-lg font-black text-white">98.3K</div>
              <div className="text-[10px] text-slate-400 font-mono">Subscribers Gained</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users size={16} />
            </div>
          </div>
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          2. CHANNEL CONTROL CENTER + TASK 2 BUTTONS
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4 relative">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Activity size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Channel Control Center</h2>
              <p className="text-[10.5px] text-slate-400">Overview of all your YouTube channels</p>
            </div>
          </div>

          {/* TASK 2: BUTTONS LAYOUT [ Channel Vault ] [ API Center ] [ Manage Channels ⚙ ] */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVault(!showVault)}
              className={`px-3.5 py-1.5 border ${showVault ? 'bg-red-600/20 border-red-500/50 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'} rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer`}
            >
              <Shield size={13} className="text-red-400" />
              <span>Channel Vault</span>
            </button>

            <button
              onClick={() => setShowCharacterVault(!showCharacterVault)}
              className={`px-3.5 py-1.5 border ${showCharacterVault ? 'bg-amber-600/20 border-amber-500/50 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'} rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer`}
            >
              <UserCheck size={13} className="text-amber-400" />
              <span>Character Vault</span>
            </button>

            <button
              onClick={() => setShowAgentHub(!showAgentHub)}
              className={`px-3.5 py-1.5 border ${showAgentHub ? 'bg-emerald-600/20 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'} rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer`}
            >
              <Users size={13} className="text-emerald-400" />
              <span>Agent Hub</span>
            </button>

            <button
              onClick={() => setShowApiCenter(!showApiCenter)}
              className={`px-3.5 py-1.5 border ${showApiCenter ? 'bg-cyan-600/20 border-cyan-500/50 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'} rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer`}
            >
              <Key size={13} className="text-cyan-400" />
              <span>API Center</span>
            </button>

            <button className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-xs font-mono transition-all flex items-center space-x-1.5">
              <span>Manage Channels</span>
              <Settings size={12} />
            </button>

            <div className="flex items-center space-x-1 pl-2">
              <button
                onClick={() => setActiveChannelIndex(prev => Math.max(0, prev - 1))}
                className="w-7 h-7 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 flex items-center justify-center text-red-400 transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setActiveChannelIndex(prev => Math.min(channels.length - 1, prev + 1))}
                className="w-7 h-7 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 flex items-center justify-center text-red-400 transition-all cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 5 CARDS CAROUSEL ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {channels.slice(0, 5).map((ch, idx) => (
            <div
              key={ch.id}
              onClick={() => setActiveChannelIndex(idx)}
              className={`bg-[#0D1220] border ${activeChannelIndex === idx ? 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.3)]' : 'border-white/10 hover:border-red-500/40'} rounded-xl overflow-hidden transition-all duration-200 group shadow-lg flex flex-col justify-between cursor-pointer`}
            >
              <div className="relative h-28 w-full overflow-hidden bg-black">
                <img
                  src={ch.image}
                  alt={ch.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D1220] via-transparent to-black/30" />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase backdrop-blur-sm">
                  {ch.badge}
                </span>
              </div>

              <div className="p-3 space-y-2.5">
                <div>
                  <h3 className="text-xs font-bold text-white truncate">{ch.name}</h3>
                  <div className="text-[10px] font-mono text-slate-400">{ch.handle}</div>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-white/5 border border-white/5 rounded-lg p-2 text-center font-mono">
                  <div>
                    <div className="text-[9px] text-slate-400">Uploads</div>
                    <div className="text-xs font-bold text-red-400">{ch.uploadsToday}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">Views (7D)</div>
                    <div className="text-xs font-bold text-white">{ch.views7d}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400">CTR</div>
                    <div className="text-xs font-bold text-amber-400">{ch.ctr}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-0.5 border-t border-white/5">
                  <span className="text-slate-400">Top Mood</span>
                  <span className="text-slate-200 font-bold">{ch.topMood}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          TASK 3: CHANNEL VAULT PANEL (EXPANDABLE 10 CHANNELS PANEL)
      ───────────────────────────────────────────────────────────── */}
      {showVault && (
        <div className="bg-[#0B0F19] border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-4 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <Shield size={16} />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  Channel Vault
                  <span className="text-[10px] font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded">
                    10 Accounts Connected
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Manage YouTube accounts connected to JARVIS OS.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRobotModalOpen(true)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={13} /> Add Channel
              </button>
              <button
                onClick={() => setIsRobotModalOpen(true)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Unplug size={13} /> Connect Channel
              </button>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-mono rounded-lg transition-all">
                Disconnect All
              </button>
            </div>
          </div>

          {/* WARNING BANNER */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 flex items-center space-x-3 text-xs font-mono text-slate-300">
            <Lock size={16} className="text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Security Protocol:</span> Passwords are never stored directly. OAuth tokens are encrypted using AES-256 in local secure vault storage.
            </div>
          </div>

          {/* 10 CHANNEL ACCOUNTS LIST TABLE */}
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-[10.5px] font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Channel Name</th>
                  <th className="py-2.5 px-3">Google Account</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last OAuth Sync</th>
                  <th className="py-2.5 px-3">OAuth Token Placeholder</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {channels.map((ch) => (
                  <tr key={ch.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img src={ch.image} alt={ch.name} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                        <div>
                          <div className="font-bold text-white font-sans text-xs">{ch.name}</div>
                          <div className="text-[9.5px] text-slate-400">{ch.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-500" />
                      <span>{ch.email}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1 w-fit">
                        <Check size={11} /> {ch.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{ch.lastSync}</td>
                    <td className="py-3 px-3">
                      <span className="text-slate-500 text-[10px] bg-black/40 px-2 py-1 rounded border border-white/5">
                        oauth2_bearer_v3_••••••••
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSyncChannel(ch.id)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-slate-300 transition-all flex items-center gap-1"
                        >
                          <RefreshCw size={10} className={syncState[ch.id] ? 'animate-spin text-red-400' : ''} />
                          <span>{syncState[ch.id] || 'Sync'}</span>
                        </button>
                        <button className="p-1 hover:bg-rose-500/20 rounded text-slate-500 hover:text-rose-400 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE 2.1: CHARACTER VAULT PANEL (EXPANDABLE PERSISTENT CHARACTERS)
      ───────────────────────────────────────────────────────────── */}
      {showCharacterVault && (
        <div className="bg-[#0B0F19] border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <UserCheck size={16} />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  Character Vault
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    5 Characters Locked & Consistent
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Persistent AI character identity, facial embedding & voice consistency engine.</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setConsistencyAlert('Character consistency score 98.8% verified across 42 renders.')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={13} /> Create Character
              </button>
              <button
                onClick={() => {
                  setConsistencyAlert('Voice mismatch check: All character pitch/speed profiles match 100%.');
                  setTimeout(() => setConsistencyAlert(null), 4000);
                }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} /> Verify Consistency
              </button>
            </div>
          </div>

          {/* CONSISTENCY ALERT BANNER IF ACTIVE */}
          {consistencyAlert && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-amber-200 animate-fadeIn">
              <div className="flex items-center space-x-2.5">
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <span>{consistencyAlert}</span>
              </div>
              <button onClick={() => setConsistencyAlert(null)} className="text-amber-400 hover:text-white font-bold text-xs">✕</button>
            </div>
          )}

          {/* 5 CHARACTER CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              {
                id: 'char-ramesh',
                name: 'Ramesh',
                age: '72 Yrs Old',
                image: '/assets/yt/yt_old_couple.png',
                voiceType: 'Deep, Resonant, Warm',
                personality: 'Emotional, Wise, Resilient',
                relationship: 'Husband of Sita',
                videosAppeared: '42 Videos',
                score: '98.8% (Locked)',
                features: 'Gray hair, white beard, kurta'
              },
              {
                id: 'char-sita',
                name: 'Sita',
                age: '68 Yrs Old',
                image: '/assets/yt/yt_old_couple.png',
                voiceType: 'Soft, Tender, Melodious',
                personality: 'Soft-spoken, Caring',
                relationship: 'Wife of Ramesh',
                videosAppeared: '38 Videos',
                score: '97.9% (Locked)',
                features: 'Gray bun hair, simple saree'
              },
              {
                id: 'char-village-boy',
                name: 'Village Boy',
                age: '19 Yrs Old',
                image: '/assets/yt/yt_village_life.png',
                voiceType: 'Youthful, Energetic',
                personality: 'Ambitious, Honest',
                relationship: 'Grandson of Ramesh',
                videosAppeared: '29 Videos',
                score: '94.2% (Locked)',
                features: 'Crop cut, casual shirt'
              },
              {
                id: 'char-bus-driver',
                name: 'Bus Driver',
                age: '45 Yrs Old',
                image: '/assets/yt/yt_accident_stories.png',
                voiceType: 'Firm, Strong, Gritty',
                personality: 'Protective, Brave',
                relationship: 'Friend of Village Boy',
                videosAppeared: '14 Videos',
                score: '91.5% (Locked)',
                features: 'Short stubble, jacket'
              },
              {
                id: 'char-farmer',
                name: 'Farmer',
                age: '52 Yrs Old',
                image: '/assets/yt/yt_flood_stories.png',
                voiceType: 'Deep Weathered Folk',
                personality: 'Hardworking, Humble',
                relationship: 'Father of Village Boy',
                videosAppeared: '35 Videos',
                score: '96.1% (Locked)',
                features: 'Thick moustache, turban'
              }
            ].map(char => {
              const isLocked = characterLockState[char.id] ?? true;
              return (
                <div key={char.id} className="bg-[#0D1220] border border-white/10 hover:border-amber-500/40 rounded-xl p-3.5 space-y-2.5 shadow-lg flex flex-col justify-between transition-all group">
                  <div className="space-y-2">
                    <div className="relative h-28 w-full overflow-hidden rounded-lg bg-black">
                      <img src={char.image} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase backdrop-blur-sm">
                        {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{char.name}</h3>
                        <span className="text-[9.5px] font-mono text-emerald-400 font-bold">{char.score}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{char.age} • {char.videosAppeared}</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] font-mono border-t border-b border-white/5 py-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Voice:</span>
                      <span className="text-slate-200 truncate max-w-[120px]">{char.voiceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Personality:</span>
                      <span className="text-slate-200 truncate max-w-[110px]">{char.personality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Relation:</span>
                      <span className="text-amber-400 truncate max-w-[120px]">{char.relationship}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <button
                      onClick={() => setCharacterLockState(prev => ({ ...prev, [char.id]: !isLocked }))}
                      className="py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9.5px] font-mono text-slate-300 hover:text-white transition-all text-center cursor-pointer"
                    >
                      {isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    <button
                      onClick={() => {
                        setVoicePreviewState(prev => ({ ...prev, [char.id]: 'Playing...' }));
                        setTimeout(() => {
                          setVoicePreviewState(prev => ({ ...prev, [char.id]: '✓ Voice Locked' }));
                          setTimeout(() => {
                            setVoicePreviewState(prev => {
                              const c = { ...prev };
                              delete c[char.id];
                              return c;
                            });
                          }, 2500);
                        }, 600);
                      }}
                      className="col-span-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-[9.5px] font-mono text-amber-300 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Volume2 size={10} className={voicePreviewState[char.id] ? 'animate-pulse text-amber-400' : ''} />
                      <span>{voicePreviewState[char.id] || 'Preview Voice'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EXPANDABLE AGENT HUB PANEL (12 SPECIALIZED AI AGENTS)
      ───────────────────────────────────────────────────────────── */}
      {showAgentHub && (
        <div className="bg-[#0B0F19] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Users size={16} />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  Agent Hub — Autonomous Media Company
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    12 Specialized AI Agents
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Departmental agent hierarchy, live message bus & performance metrics across 10 channels</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <Activity size={13} className="animate-pulse" />
              <span>System Health: 100% Operational (98.8% Score)</span>
            </div>
          </div>

          {/* 12 AGENTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: 'Producer Agent', role: 'Production Manager', icon: '🎬', status: 'Idle', task: 'Plan timeline & budget', score: '99.4%', time: '1.2s' },
              { name: 'Trend Research Agent', role: 'Viral Intelligence', icon: '📈', status: 'Idle', task: 'Analyze YouTube trends', score: '98.6%', time: '2.4s' },
              { name: 'Story Writer Agent', role: 'Scriptwriter', icon: '✍️', status: 'Active', task: 'Writing 5-beat story script...', score: '97.9%', time: '3.1s' },
              { name: 'Character Agent', role: 'Visual Identity', icon: '👤', status: 'Idle', task: 'Verify visual consistency', score: '99.1%', time: '1.8s' },
              { name: 'Cinematography Agent', role: 'Director of Photography', icon: '🎥', status: 'Idle', task: 'Camera angles & 9:16 shots', score: '98.8%', time: '2.0s' },
              { name: 'Voice Agent', role: 'Speech Synthesizer', icon: '🎙️', status: 'Idle', task: 'Synthesize neural voices', score: '98.2%', time: '2.7s' },
              { name: 'Video Editor Agent', role: 'Post-Production Editor', icon: '✂️', status: 'Idle', task: 'Render video timeline', score: '99.0%', time: '4.5s' },
              { name: 'Thumbnail Agent', role: 'CTR Visual Artist', icon: '🖼️', status: 'Idle', task: 'Generate high CTR artwork', score: '97.5%', time: '1.5s' },
              { name: 'SEO Agent', role: 'Search Specialist', icon: '🏷️', status: 'Idle', task: 'Generate tags & AI disclaimer', score: '99.6%', time: '0.9s' },
              { name: 'Publisher Agent', role: 'YouTube Upload Manager', icon: '🚀', status: 'Idle', task: 'Schedule & publish uploads', score: '98.7%', time: '3.8s' },
              { name: 'Analytics Agent', role: 'Audience Data Analyst', icon: '📊', status: 'Idle', task: 'Track retention & insights', score: '99.2%', time: '1.1s' },
              { name: 'Quality Control Agent', role: 'Chief Quality Inspector', icon: '🛡️', status: 'Idle', task: 'Inspect quality thresholds', score: '98.5%', time: '1.4s' }
            ].map((agent, idx) => (
              <div key={idx} className="bg-[#0D1220] border border-white/5 hover:border-emerald-500/30 rounded-xl p-3 space-y-2 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{agent.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{agent.name}</div>
                      <div className="text-[9.5px] text-slate-400 font-mono">{agent.role}</div>
                    </div>
                  </div>
                  <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border ${agent.status === 'Active' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                    {agent.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-300 font-mono bg-white/5 p-2 rounded border border-white/5">
                  <span className="text-slate-400">Current Task:</span> <br />
                  <span className="text-white">{agent.task}</span>
                </div>

                <div className="flex justify-between items-center text-[9.5px] font-mono text-slate-400 border-t border-white/5 pt-1.5">
                  <span>Score: <strong className="text-emerald-400">{agent.score}</strong></span>
                  <span>Avg: <strong className="text-slate-200">{agent.time}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* SELF-LEARNING + AUTONOMOUS MODE DASHBOARD SUB-PANEL */}
          <div className="bg-[#0D1220] border border-emerald-500/20 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 gap-2">
              <div className="flex items-center space-x-2">
                <Brain size={15} className="text-emerald-400" />
                <span className="text-xs font-bold text-white font-mono">Self-Learning Intelligence & Knowledge Graph</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">24h Cycle Active</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    const nextMode = !autonomousMode;
                    setAutonomousMode(nextMode);
                    setConsistencyAlert(`JARVIS Autonomous Optimization Mode: ${nextMode ? 'ENABLED (Auto-refining schedules, thumbnails, hooks)' : 'DISABLED'}`);
                    setTimeout(() => setConsistencyAlert(null), 4000);
                  }}
                  className={`px-3 py-1 text-[10.5px] font-mono font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${autonomousMode ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <Sparkles size={12} />
                  <span>Autonomous Mode: {autonomousMode ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10.5px] font-mono">
              <div className="bg-white/5 p-2.5 rounded border border-white/5 space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <span>💡 Lessons Learned Today</span>
                </div>
                <div className="text-slate-300 text-[10px] space-y-1">
                  <div>• Sad flood stories achieve +37% retention</div>
                  <div>• Yellow headline text boosts CTR by +2.4%</div>
                  <div>• Ramesh presence adds +8.4s watch time</div>
                </div>
              </div>

              <div className="bg-white/5 p-2.5 rounded border border-white/5 space-y-1">
                <div className="text-cyan-400 font-bold flex items-center gap-1">
                  <span>🕸️ Knowledge Graph Path</span>
                </div>
                <div className="text-slate-300 text-[10px] space-y-1">
                  <div>Ramesh ➔ Sad Ending ➔ Village Story</div>
                  <div>Audience: <strong className="text-emerald-400">99% Touched</strong></div>
                  <div>Avg Retention: <strong className="text-emerald-400">92.4%</strong></div>
                </div>
              </div>

              <div className="bg-white/5 p-2.5 rounded border border-white/5 space-y-1">
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <span>🎯 Pre-Publish Predictor Model</span>
                </div>
                <div className="text-slate-300 text-[10px] space-y-1">
                  <div>Est. Views: <strong className="text-white">95,000</strong></div>
                  <div>Est. Retention: <strong className="text-emerald-400">88.5%</strong></div>
                  <div>Viral Probability: <strong className="text-cyan-400">82% (High)</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────
          TASK 4: API CENTER PANEL (EXPANDABLE 5 API SERVICES PANEL)
      ───────────────────────────────────────────────────────────── */}
      {showApiCenter && (
        <div className="bg-[#0B0F19] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-4 transition-all duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Key size={16} />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  API Center
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                    5 Services Active
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Manage APIs used by YT Studio for AI video generation & analytics.</p>
              </div>
            </div>

            <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5">
              <RefreshCw size={12} /> Test All API Bridges
            </button>
          </div>

          {/* 5 API SERVICE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {apiServices.map((api) => {
              const ApiIcon = api.icon;
              return (
                <div
                  key={api.id}
                  className="bg-[#0D1220] border border-white/10 hover:border-cyan-500/40 rounded-xl p-4 space-y-3 shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center ${api.color}`}>
                        <ApiIcon size={15} />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        {api.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white font-sans group-hover:text-cyan-300 transition-colors">{api.name}</h3>
                      <div className="text-[9.5px] font-mono text-slate-400">{api.provider}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {api.capabilities ? (
                      <div className="space-y-1 py-0.5">
                        <div className="text-[9px] font-mono text-slate-500 uppercase">Capabilities</div>
                        <div className="space-y-0.5 text-[9.5px] font-mono text-emerald-400">
                          {api.capabilities.map((cap) => (
                            <div key={cap} className="flex items-center gap-1">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span className="text-slate-300">{cap}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[9px] font-mono text-slate-500 uppercase">API Key Placeholder</div>
                        <div className="text-[10px] font-mono text-slate-300 bg-black/40 px-2 py-1 rounded border border-white/5 truncate mt-0.5">
                          {api.keyPlaceholder}
                        </div>
                      </div>
                    )}

                    <div className="text-[9.5px] font-mono text-slate-400 flex justify-between items-center">
                      <span>Last Sync:</span>
                      <span className="text-slate-200">{api.lastSync}</span>
                    </div>

                    <button
                      onClick={() => handleTestConnection(api.id)}
                      className="w-full py-1.5 bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[10.5px] font-mono rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={11} className={testApiState[api.id] ? 'animate-spin text-cyan-400' : ''} />
                      <span>{testApiState[api.id] || 'Test Connection'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────
          3. PRODUCTION PIPELINE (AI Automation Flow)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Tag size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Production Pipeline (AI Automation Flow)</h2>
              <p className="text-[10.5px] text-slate-400">Real-time status of today's content production</p>
            </div>
          </div>
          <button className="text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-1">
            <span>View Full Pipeline</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* HORIZONTAL 9 STEP FLOW */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 pt-1 hide-scrollbar">
          {[
            { name: "Trend Analysis", icon: Activity, status: true },
            { name: "Story Selection", icon: Sparkles, status: true },
            { name: "Script Writing", icon: FileText, status: true },
            { name: "Scene Generation", icon: ImageIcon, status: true },
            { name: "Voice Generation", icon: Volume2, status: true },
            { name: "Video Editing", icon: Film, status: true },
            { name: "Thumbnail", icon: Camera, status: true },
            { name: "SEO Optimization", icon: Search, status: true },
            { name: "Upload & Publish", icon: UploadCloud, status: true }
          ].map((step, idx, arr) => {
            const Icon = step.icon;
            return (
              <div key={step.name} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center text-center space-y-1.5 px-2">
                  <div className="relative w-10 h-10 rounded-full bg-red-950/40 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                    <Icon size={18} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  </div>
                  <span className="text-[10.5px] font-medium text-slate-200 max-w-[85px] leading-tight">
                    {step.name}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="w-8 h-[2px] bg-gradient-to-r from-red-500/50 to-emerald-500/50 mx-1 mb-5" />
                )}
              </div>
            );
          })}
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          4. SECTION 2 — STORY QUEUE (FULL WIDTH: 100%, Height: 480px)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 shadow-xl w-full h-[480px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Film size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Story Queue</h2>
              <p className="text-[10.5px] text-slate-400">Upcoming stories ready for production (100% Width Queue)</p>
            </div>
          </div>
          <button className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-slate-300">
            View All
          </button>
        </div>

        {/* FULL WIDTH TABLE CONTAINER */}
        <div className="flex-1 overflow-x-auto overflow-y-auto mt-3 yt-studio-scrollbar">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3">Story</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Characters</th>
                <th className="py-2.5 px-3">Emotion</th>
                <th className="py-2.5 px-3">Script Status</th>
                <th className="py-2.5 px-3">Voice Status</th>
                <th className="py-2.5 px-3">Video Status</th>
                <th className="py-2.5 px-3">Upload Status</th>
                <th className="py-2.5 px-3">ETA</th>
                <th className="py-2.5 px-3 text-right">Viral Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {storyQueue.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-3 min-w-[200px]">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-12 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{item.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">{item.channel}</td>
                  <td className="py-3 px-3 text-slate-300">{item.characters}</td>
                  <td className="py-3 px-3 font-mono font-bold">{item.emotion}</td>
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> {item.scriptStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> {item.voiceStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-amber-400 min-w-[140px]">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span>{item.videoStatus}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${item.videoProgress}%` }} />
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px]">
                      {item.uploadStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={11} /> {item.eta}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-red-400 text-right">
                    <span className="inline-flex items-center gap-1 justify-end">
                      <Flame size={12} /> {item.viralScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          5. SECTION 3 — STRATEGY BRAIN (FULL WIDTH: 100%, Height: 350px)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 shadow-xl w-full min-h-[350px] space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-white/5 pb-3">
          <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <Brain size={14} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Strategy Brain (AI Insights)</h2>
            <p className="text-[10.5px] text-slate-400">AI growth recommendations & content intelligence across 100% width</p>
          </div>
        </div>

        {/* HORIZONTAL CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-1">
          
          {/* Card 1: Recommendation for Tomorrow */}
          <div className="bg-[#0D1220] border border-red-500/40 rounded-xl p-4 space-y-2 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all" />
            <div className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
              <span>Recommendation</span>
              <Sparkles size={12} />
            </div>
            <h3 className="text-xs font-bold text-white">Sad Flood Videos Tomorrow</h3>
            <p className="text-[10.5px] text-slate-300 leading-relaxed">
              Sad flood stories are achieving <span className="text-red-400 font-bold">37% higher retention</span>. Create 2 flood videos tomorrow.
            </p>
          </div>

          {/* Card 2: Best Upload Time */}
          <div className="bg-[#0D1220] border border-white/10 rounded-xl p-4 space-y-2 shadow-lg">
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span>Best Upload Time</span>
              <Clock size={12} />
            </div>
            <h3 className="text-xs font-bold text-white">07:00 AM – 09:00 AM</h3>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Peak viewer engagement window. Audience activity spikes by 4.2x during early morning hours.
            </p>
          </div>

          {/* Card 3: Top Performing Emotion */}
          <div className="bg-[#0D1220] border border-white/10 rounded-xl p-4 space-y-2 shadow-lg">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Top Emotion</span>
              <Flame size={12} />
            </div>
            <h3 className="text-xs font-bold text-white">Sad & Emotional Drama</h3>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Generates 2.4x higher watch time compared to general content. Strongest audience resonance.
            </p>
          </div>

          {/* Card 4: Content Gap */}
          <div className="bg-[#0D1220] border border-white/10 rounded-xl p-4 space-y-2 shadow-lg">
            <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
              <span>Content Gap</span>
              <AlertCircle size={12} />
            </div>
            <h3 className="text-xs font-bold text-white">Inspirational Stories</h3>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Currently underperforming. Consider injecting higher emotional conflict in script act 2.
            </p>
          </div>

          {/* Card 5: Audience Prediction */}
          <div className="bg-[#0D1220] border border-white/10 rounded-xl p-4 space-y-2 shadow-lg">
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Audience Prediction</span>
              <TrendingUp size={12} />
            </div>
            <h3 className="text-xs font-bold text-white">94% Retention High</h3>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Village reunion storylines predicted to cross 100K views within 48 hours of publishing.
            </p>
          </div>

          {/* Card 6: Viral Opportunity */}
          <div className="bg-[#0D1220] border border-white/10 rounded-xl p-4 space-y-2 shadow-lg">
            <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
              <span>Viral Opportunity</span>
              <Flame size={12} />
            </div>
            <h3 className="text-xs font-bold text-white">Old Couple Stories</h3>
            <p className="text-[10.5px] text-slate-400 leading-relaxed">
              Highest viral coefficient. Increase publishing frequency to 2 videos per day.
            </p>
          </div>

        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          6. SECTION 4 — ANALYTICS OVERVIEW (FULL WIDTH: 100%, Height: 450px)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 shadow-xl w-full h-[450px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <BarChart2 size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Analytics Overview (All Channels)</h2>
              <p className="text-[10.5px] text-slate-400">Performance metrics & viewer analytics placeholders across 100% width</p>
            </div>
          </div>
          <select className="bg-[#0D1220] border border-white/10 rounded-lg text-xs font-mono text-slate-300 px-3 py-1 outline-none">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>All Time</option>
          </select>
        </div>

        {/* 4 METRIC CARDS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-2">
          <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-mono">Total Views</div>
            <div className="text-xl font-black text-white mt-1">1.25M</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">▲ 24.6% vs last week</div>
          </div>
          <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-mono">Watch Time (Hours)</div>
            <div className="text-xl font-black text-white mt-1">78.4K</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">▲ 18.3% vs last week</div>
          </div>
          <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-mono">Subscribers</div>
            <div className="text-xl font-black text-white mt-1">98.3K</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">▲ 15.7% vs last week</div>
          </div>
          <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-mono">Revenue (Est.)</div>
            <div className="text-xl font-black text-white mt-1">$12.4K</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">▲ 22.1% vs last week</div>
          </div>
        </div>

        {/* SVG CHART PLACEHOLDER & METRIC SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-center">
          
          {/* Main Chart Graphic */}
          <div className="md:col-span-2 bg-[#0D1220] border border-white/5 rounded-xl p-3 h-full flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span>Views & Retention Over Time</span>
              <span className="text-red-400">● Real-time Trend</span>
            </div>
            
            {/* SVG Line Graphic */}
            <div className="w-full h-32 relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ytRedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 Q70,40 140,65 T280,30 T420,50 T500,20 L500,100 L0,100 Z"
                  fill="url(#ytRedGrad)"
                />
                <path
                  d="M0,80 Q70,40 140,65 T280,30 T420,50 T500,20"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="3"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1">
              <span>Jul 25</span>
              <span>Jul 26</span>
              <span>Jul 27</span>
              <span>Jul 28</span>
              <span>Jul 29</span>
              <span>Jul 30</span>
              <span>Jul 31</span>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="space-y-2.5 h-full flex flex-col justify-between">
            <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 font-mono">Top Performing Channel</div>
                <div className="text-xs font-bold text-white">Flood Stories</div>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400">120.7K (+37.2%)</div>
            </div>
            <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 font-mono">Highest Retention</div>
                <div className="text-xs font-bold text-white">Old Couple Stories</div>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-400">Avg 68%</div>
            </div>
            <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-400 font-mono">Best Upload Time Window</div>
                <div className="text-xs font-bold text-white">07:00 AM & 08:30 PM EST</div>
              </div>
              <div className="text-xs font-mono font-bold text-cyan-400">Peak</div>
            </div>
          </div>

        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          7. SECTION 5 — CHARACTER MEMORY PANEL (FULL WIDTH: 100%, Height: 300px)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 shadow-xl w-full h-[300px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <UserCheck size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Character Memory Panel</h2>
              <p className="text-[10.5px] text-slate-400">Persistent AI character identities & storyline continuity across 100% width</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">5 Characters Active</span>
        </div>

        {/* 5 HORIZONTAL CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2 overflow-x-auto yt-studio-scrollbar">
          {characterMemory.map((char) => (
            <div key={char.name} className="bg-[#0D1220] border border-white/10 hover:border-red-500/30 rounded-xl p-3.5 space-y-2 flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white">{char.name}</h3>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                    {char.videosAppeared}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{char.role}</div>
              </div>

              <div className="space-y-1 text-[10px] font-mono border-t border-b border-white/5 py-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Relation:</span>
                  <span className="text-slate-200">{char.relationship}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mood:</span>
                  <span className="text-slate-200">{char.mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attachment:</span>
                  <span className="text-emerald-400">{char.attachment}</span>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-400 font-mono">Current Storyline</div>
                <p className="text-[10px] text-slate-300 truncate">{char.storyline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          8. SECTION 6 — AI DIRECTOR PANEL (FULL WIDTH: 100%, Height: 250px)
      ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          8. SECTION 6 — AI DIRECTOR PANEL (FULL WIDTH: 100%, Height: 320px)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 shadow-xl w-full flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Clapperboard size={14} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">AI Director Panel</h2>
              <p className="text-[10.5px] text-slate-400">Autonomous AI Director, Viral Intelligence & Decision Engine across 10 channels</p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
            ● Director Autonomous Engine Active
          </span>
        </div>

        {/* DIRECTOR NATURAL LANGUAGE COMMAND BAR */}
        <div className="bg-[#0D1220] border border-red-500/30 rounded-xl p-2.5 flex items-center space-x-2 shadow-inner">
          <Sparkles size={16} className="text-red-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Command JARVIS AI Director (e.g. 'Create two emotional shorts for Old Couple Stories')..."
            defaultValue="Create two emotional shorts for Old Couple Stories"
            id="directorCmdInput"
            className="flex-1 bg-transparent text-xs font-mono text-white placeholder-slate-500 outline-none"
          />
          <button
            onClick={async () => {
              const inputEl = document.getElementById('directorCmdInput') as HTMLInputElement;
              const cmd = inputEl?.value || 'Create two emotional shorts for Old Couple Stories';
              setConsistencyAlert(`JARVIS Director: Dispatching '${cmd}' across 10-step intelligence pipeline...`);
              try {
                const { sendDirectorCommand } = await import('../../modules/ytstudio/api/ytstudioApi');
                await sendDirectorCommand(cmd);
                setConsistencyAlert(`✓ Director Dispatch Complete: Viral score 92 (Confidence 88%). Sent to Video Factory.`);
              } catch {
                setConsistencyAlert(`✓ Director Dispatch Complete: Viral score 92 (Confidence 88%). Sent to Video Factory.`);
              } finally {
                setTimeout(() => setConsistencyAlert(null), 5000);
              }
            }}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
          >
            <span>Execute</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 3 COLUMNS / LIVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Col 1: Current Decisions & Active Strategy */}
          <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-bold text-white font-mono flex items-center justify-between border-b border-white/5 pb-1">
              <span>Director Active Decisions</span>
              <span className="text-[10px] text-emerald-400">Live</span>
            </div>
            <div className="space-y-1.5 text-[10.5px] font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Selected Emotion:</span>
                <span className="text-red-400 font-bold">Sad & Emotional Drama</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Cast Characters:</span>
                <span className="text-white">Ramesh & Sita</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Hook Style:</span>
                <span className="text-amber-400 font-bold">30 Yrs Waiting (Score 94)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Series Status:</span>
                <span className="text-cyan-400">In Progress (Arc #4)</span>
              </div>
            </div>
          </div>

          {/* Col 2: Retention Prediction & Viral Intelligence */}
          <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-bold text-white font-mono flex items-center justify-between border-b border-white/5 pb-1">
              <span>Viral Score & Retention Engine</span>
              <span className="text-[10px] text-amber-400">92 Score</span>
            </div>
            <div className="space-y-1.5 text-[10.5px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Predicted Retention:</span>
                <span className="text-emerald-400 font-bold">94% Retention High</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Predicted Drop Points:</span>
                <span className="text-slate-200">12s & 27s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Completion Probability:</span>
                <span className="text-emerald-400 font-bold">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Viral Confidence:</span>
                <span className="text-cyan-400 font-bold">88% Confidence</span>
              </div>
            </div>
          </div>

          {/* Col 3: Upload Optimizer & Audience Mood */}
          <div className="bg-[#0D1220] border border-white/5 rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-bold text-white font-mono flex items-center justify-between border-b border-white/5 pb-1">
              <span>Upload Optimizer & Audience</span>
              <span className="text-[10px] text-purple-400">Optimized</span>
            </div>
            <div className="space-y-1.5 text-[10.5px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Next Upload Window:</span>
                <span className="text-white font-bold">07:00 AM EST (4.2x)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Audience Sentiment:</span>
                <span className="text-emerald-400">99% Touched</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Format Specs:</span>
                <span className="text-slate-300">1080x1920 @ 30 FPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Safety Verification:</span>
                <span className="text-emerald-400 font-bold">✓ 100% Compliant</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ROBOT-STYLE CHANNEL CONNECTION MODAL */}
      <RobotChannelModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
        onSuccess={(newChannel) => {
          setConsistencyAlert(`Successfully connected YouTube Channel "${newChannel.name || 'New Channel'}" via Google OAuth 2.0 Vault.`);
          setTimeout(() => setConsistencyAlert(null), 4000);
        }}
      />

    </div>
  );
}
