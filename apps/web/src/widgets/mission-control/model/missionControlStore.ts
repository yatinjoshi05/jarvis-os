import { create } from 'zustand';

export interface SystemHealth {
  cpu: number;
  ram: number;
  storage: number;
  gpu: number;
  network: 'Online' | 'Offline' | 'Warning';
}

export interface ActiveModule {
  id: string;
  name: string;
  status: 'active' | 'sleeping' | 'loading' | 'error';
  icon: string;
}

export interface CurrentMission {
  id: string;
  title: string;
  progress: number;
  deadline: string;
  assignedAgents: string[];
  status: 'IN_PROGRESS' | 'PLANNING' | 'COMPLETED' | 'PAUSED';
}

export interface TimelineEvent {
  id: string;
  time: string;
  message: string;
  type: 'browser' | 'voice' | 'pdf' | 'mission' | 'file' | 'system';
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: 'working' | 'waiting' | 'offline';
}

export interface MemorySummary {
  recentConversations: string[];
  importantFacts: string[];
  pinnedMemories: string[];
}

export interface UpcomingAction {
  id: string;
  title: string;
  time: string;
  category: 'Scheduled' | 'Automation' | 'Reminder' | 'Pending';
}

interface MissionControlState {
  systemHealth: SystemHealth;
  activeModules: ActiveModule[];
  currentMission: CurrentMission;
  timeline: TimelineEvent[];
  notificationsCount: number;
  agents: AgentInfo[];
  memorySummary: MemorySummary;
  upcomingActions: UpcomingAction[];

  startMission: (title?: string) => void;
  stopMission: () => void;
  updateStatus: (moduleName: string, status: ActiveModule['status']) => void;
  createTask: (title: string) => void;
  addTimelineEvent: (message: string, type: TimelineEvent['type']) => void;
}

export const useMissionControlStore = create<MissionControlState>((set) => ({
  systemHealth: {
    cpu: 14,
    ram: 38,
    storage: 42,
    gpu: 18,
    network: 'Online',
  },

  activeModules: [
    { id: 'browser', name: 'Browser', status: 'active', icon: 'Globe' },
    { id: 'voice', name: 'Voice', status: 'active', icon: 'Mic' },
    { id: 'memory', name: 'Memory', status: 'active', icon: 'Database' },
    { id: 'vision', name: 'Vision', status: 'sleeping', icon: 'Eye' },
    { id: 'automation', name: 'Automation', status: 'active', icon: 'Zap' },
    { id: 'terminal', name: 'Terminal', status: 'active', icon: 'Terminal' },
    { id: 'files', name: 'Files', status: 'sleeping', icon: 'Folder' },
  ],

  currentMission: {
    id: 'm-101',
    title: 'JARVIS OS Browser Subsystem Verification & Neural Deployment',
    progress: 78,
    deadline: 'Today, 18:00',
    assignedAgents: ['Browser Agent', 'Memory Agent', 'Voice Agent'],
    status: 'IN_PROGRESS',
  },

  timeline: [
    { id: 't-1', time: '09:45', message: 'Browser module initialized and connected to localhost:5173', type: 'browser' },
    { id: 't-2', time: '09:46', message: 'Voice command detected: "Analyze system diagnostics"', type: 'voice' },
    { id: 't-3', time: '09:47', message: 'PDF dissertation report parsed and indexed into vector memory', type: 'pdf' },
    { id: 't-4', time: '09:48', message: 'Mission #101 created: Browser Subsystem Verification', type: 'mission' },
    { id: 't-5', time: '09:49', message: 'File uploaded: browser_audit_report.md', type: 'file' },
  ],

  notificationsCount: 3,

  agents: [
    { id: 'a-1', name: 'Browser Agent', role: 'Universal Web Preview Engine', status: 'working' },
    { id: 'a-2', name: 'Voice Agent', role: 'Neural Speech Synthesizer', status: 'working' },
    { id: 'a-3', name: 'Memory Agent', role: 'Knowledge Base Vector Indexer', status: 'waiting' },
    { id: 'a-4', name: 'Vision Agent', role: 'Real-time Camera & UI Inspector', status: 'waiting' },
    { id: 'a-5', name: 'Automation Agent', role: 'Background Process Runner', status: 'working' },
  ],

  memorySummary: {
    recentConversations: [
      'JARVIS Terminal Phase 3.2B workspace split configuration',
      'Browser Module Phase 2C App Preview Engine implementation',
      'Forensic audit report verification for Browser subsystem',
    ],
    importantFacts: [
      'User preferred OS: Windows 11',
      'Active workspace path: d:/jarvis',
      'Primary dev server port: 5173',
    ],
    pinnedMemories: [
      'Phase 1 UI is permanently locked across Browser & Mission Control',
      'Use .hide-scrollbar CSS utility for clean custom scrollable panels',
    ],
  },

  upcomingActions: [
    { id: 'u-1', title: 'Execute full system telemetry diagnostic audit', time: '14:30', category: 'Scheduled' },
    { id: 'u-2', title: 'Automated memory index vector optimization', time: '16:00', category: 'Automation' },
    { id: 'u-3', title: 'Review Voice module audio pipeline architecture', time: '17:15', category: 'Reminder' },
    { id: 'u-4', title: 'Sync project workspace changes to cloud repository', time: '18:45', category: 'Pending' },
  ],

  startMission: (title) => {
    set((state) => ({
      currentMission: {
        ...state.currentMission,
        title: title || 'New JARVIS Operational Mission',
        progress: 10,
        status: 'IN_PROGRESS',
      },
    }));
  },

  stopMission: () => {
    set((state) => ({
      currentMission: {
        ...state.currentMission,
        status: 'PAUSED',
      },
    }));
  },

  updateStatus: (moduleName, status) => {
    set((state) => ({
      activeModules: state.activeModules.map((m) =>
        m.name.toLowerCase() === moduleName.toLowerCase() ? { ...m, status } : m
      ),
    }));
  },

  createTask: (title) => {
    set((state) => ({
      upcomingActions: [
        { id: `u-${Date.now()}`, title, time: 'Just now', category: 'Pending' },
        ...state.upcomingActions,
      ],
    }));
  },

  addTimelineEvent: (message, type) => {
    set((state) => ({
      timeline: [
        {
          id: `t-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          message,
          type,
        },
        ...state.timeline,
      ],
    }));
  },
}));
