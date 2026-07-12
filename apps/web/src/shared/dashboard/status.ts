import { SystemStatus, ConnectionStatus } from './types';
import { dashboardEventEmitter, DashboardEvents } from './events';

class StatusManager {
  private status: SystemStatus = {
    ai: 'idle',
    voice: 'ready',
    memory: {
      usagePercent: 35,
      transientCount: 1,
      persistentCount: 12
    },
    connection: 'connected',
    microphone: 'available'
  };

  public getStatus(): SystemStatus {
    return { ...this.status };
  }

  public setAIStatus(aiState: SystemStatus['ai']) {
    this.status.ai = aiState;
    this.notify();
  }

  public setVoiceStatus(voiceState: SystemStatus['voice']) {
    this.status.voice = voiceState;
    this.notify();
  }

  public setConnectionStatus(connection: ConnectionStatus) {
    this.status.connection = connection;
    this.notify();
  }

  public setMicrophoneStatus(micState: SystemStatus['microphone']) {
    this.status.microphone = micState;
    this.notify();
  }

  public setMemoryUsage(usagePercent: number, transientCount: number, persistentCount: number) {
    this.status.memory = {
      usagePercent,
      transientCount,
      persistentCount
    };
    this.notify();
  }

  private notify() {
    dashboardEventEmitter.emit(DashboardEvents.STATUS_CHANGED, { ...this.status });
  }
}

export const statusManager = new StatusManager();
export default statusManager;
