import { create } from 'zustand';
import { systemMonitorService, SystemMetrics, ProcessItem } from '../services/SystemMonitorService';
import { memoryEngine, MemoryRecord, MemoryCategory } from '../services/MemoryEngine';
import { voiceService, VoiceServiceStatus } from '../services/VoiceService';
import { eventBus, MissionControlEvent } from '../services/EventBus';

interface MissionControlState {
  systemMetrics: SystemMetrics;
  memories: MemoryRecord[];
  voiceState: VoiceServiceStatus;
  events: MissionControlEvent[];
  activeProcesses: ProcessItem[];

  updateHealth: (metrics: Partial<SystemMetrics>) => void;
  saveMemory: (record: Omit<MemoryRecord, 'id' | 'date'>) => void;
  searchMemory: (query: string, category?: MemoryCategory) => MemoryRecord[];
  startListening: () => void;
  stopListening: () => void;
  executeCommand: (cmd: string) => void;
  addEvent: (type: any, data: any) => void;
}

export const useMissionControlStore = create<MissionControlState>((set) => {
  // Initialize real-time monitoring and event subscriptions
  systemMonitorService.start(1000);
  systemMonitorService.subscribe((metrics) => {
    set({
      systemMetrics: metrics,
      activeProcesses: metrics.processes,
    });
  });

  voiceService.subscribe((vState) => {
    set({ voiceState: vState });
  });

  return {
    systemMetrics: systemMonitorService.getMetrics(),
    memories: memoryEngine.getAllMemories(),
    voiceState: voiceService.getStatus(),
    events: [],
    activeProcesses: systemMonitorService.getMetrics().processes,

    updateHealth: (metrics) => {
      set((state) => ({
        systemMetrics: { ...state.systemMetrics, ...metrics },
      }));
    },

    saveMemory: (record) => {
      memoryEngine.remember(record);
      set({ memories: memoryEngine.getAllMemories() });
    },

    searchMemory: (query, category) => {
      return memoryEngine.search(query, category);
    },

    startListening: () => {
      voiceService.startListening();
    },

    stopListening: () => {
      voiceService.stopListening();
    },

    executeCommand: (cmd) => {
      voiceService.executeVoiceCommand(cmd);
    },

    addEvent: (type, data) => {
      const evt = eventBus.emit(type, data);
      set((state) => ({
        events: [evt, ...state.events].slice(0, 50),
      }));
    },
  };
});
