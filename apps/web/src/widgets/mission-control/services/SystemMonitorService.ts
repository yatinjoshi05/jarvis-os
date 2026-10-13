import { eventBus } from './EventBus';

export type SystemHealthState = 'Healthy' | 'Warning' | 'Critical' | 'Offline';

export interface ProcessItem {
  id: string;
  name: string;
  cpu: number;
  memoryMb: number;
  status: 'running' | 'idle' | 'high_usage';
}

export interface SystemMetrics {
  cpu: number;
  ram: number;
  gpu: number;
  disk: number;
  networkSpeedMb: number;
  batteryPercent: number;
  uptimeSeconds: number;
  temperatureC: number;
  activeProcessesCount: number;
  healthState: SystemHealthState;
  healthMessage: string;
  processes: ProcessItem[];
}

export class SystemMonitorService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private metrics: SystemMetrics = {
    cpu: 14,
    ram: 38,
    gpu: 18,
    disk: 42,
    networkSpeedMb: 12.4,
    batteryPercent: 98,
    uptimeSeconds: 84200,
    temperatureC: 41,
    activeProcessesCount: 14,
    healthState: 'Healthy',
    healthMessage: 'All systems operating within optimal parameters',
    processes: [
      { id: 'p-1', name: 'jarvis-kernel-service', cpu: 2.1, memoryMb: 140, status: 'running' },
      { id: 'p-[#2]', name: 'browser-webview-engine', cpu: 4.8, memoryMb: 320, status: 'running' },
      { id: 'p-3', name: 'voice-speech-synthesizer', cpu: 1.2, memoryMb: 85, status: 'idle' },
      { id: 'p-4', name: 'vector-memory-indexer', cpu: 3.4, memoryMb: 210, status: 'running' },
      { id: 'p-5', name: 'vision-camera-inspector', cpu: 0.8, memoryMb: 60, status: 'idle' },
    ],
  };

  private listeners: Set<(metrics: SystemMetrics) => void> = new Set();

  public start(intervalMs: number = 1000) {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getMetrics(): SystemMetrics {
    return this.metrics;
  }

  public subscribe(callback: (metrics: SystemMetrics) => void): () => void {
    this.listeners.add(callback);
    callback(this.metrics);
    return () => this.listeners.delete(callback);
  }

  private tick() {
    // Simulate real-time metric fluctuations
    const cpuDelta = (Math.random() - 0.5) * 4;
    const ramDelta = (Math.random() - 0.5) * 2;
    const gpuDelta = (Math.random() - 0.5) * 3;
    const tempDelta = (Math.random() - 0.5) * 1;

    const cpu = Math.min(99, Math.max(5, Math.round(this.metrics.cpu + cpuDelta)));
    const ram = Math.min(99, Math.max(20, Math.round(this.metrics.ram + ramDelta)));
    const gpu = Math.min(99, Math.max(8, Math.round(this.metrics.gpu + gpuDelta)));
    const temperatureC = Math.min(85, Math.max(35, Math.round(this.metrics.temperatureC + tempDelta)));

    let healthState: SystemHealthState = 'Healthy';
    let healthMessage = 'All systems operating within optimal parameters';

    if (cpu > 85 || ram > 90 || temperatureC > 75) {
      healthState = 'Critical';
      healthMessage = `Critical system load detected: CPU ${cpu}%, Temp ${temperatureC}°C`;
      eventBus.emit('system warning', { level: 'critical', cpu, temperatureC });
    } else if (cpu > 70 || ram > 80 || temperatureC > 65) {
      healthState = 'Warning';
      healthMessage = `Elevated system resource usage: CPU ${cpu}%`;
      eventBus.emit('system warning', { level: 'warning', cpu });
    }

    this.metrics = {
      ...this.metrics,
      cpu,
      ram,
      gpu,
      temperatureC,
      uptimeSeconds: this.metrics.uptimeSeconds + 1,
      networkSpeedMb: Math.round((8 + Math.random() * 10) * 10) / 10,
      healthState,
      healthMessage,
    };

    this.listeners.forEach((fn) => fn(this.metrics));
  }
}

export const systemMonitorService = new SystemMonitorService();
