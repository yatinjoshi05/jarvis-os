import { connectionManager, ServiceName } from './ConnectionManager';
import { geminiService } from './GeminiService';
import { whatsAppService } from './WhatsAppService';
import { liveKitService } from './LiveKitService';
import { googleSheetsService } from './GoogleSheetsService';
import { telegramService } from './TelegramService';
import { emailService } from './EmailService';

export type HealthStatus = 'Connected' | 'Disconnected' | 'Error' | 'Rate limited' | 'Checking';

export interface ServiceHealthReport {
  service: ServiceName;
  name: string;
  status: HealthStatus;
  latencyMs: number;
  lastSync: string;
  errorLog: string[];
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private reports = new Map<ServiceName, ServiceHealthReport>();
  private subscribers: (() => void)[] = [];

  private constructor() {
    this.initReports();
    this.startHealthCheckLoop();
  }

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  private initReports() {
    const services: { id: ServiceName; name: string }[] = [
      { id: 'gemini', name: 'Gemini AI Engine' },
      { id: 'whatsapp', name: 'WhatsApp Business API' },
      { id: 'livekit', name: 'LiveKit Voice Engine' },
      { id: 'google_sheets', name: 'Google Sheets Storage' },
      { id: 'telegram', name: 'Telegram Alert Bot' },
      { id: 'smtp', name: 'SMTP Email Service' },
    ];

    services.forEach((s) => {
      this.reports.set(s.id, {
        service: s.id,
        name: s.name,
        status: connectionManager.isServiceConfigured(s.id) ? 'Disconnected' : 'Disconnected',
        latencyMs: 0,
        lastSync: 'Never',
        errorLog: connectionManager.isServiceConfigured(s.id) ? [] : ['Credentials required'],
      });
    });
  }

  public subscribe(cb: () => void): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  public getHealthReports(): ServiceHealthReport[] {
    return Array.from(this.reports.values());
  }

  public getReport(service: ServiceName): ServiceHealthReport | undefined {
    return this.reports.get(service);
  }

  public async runHealthCheckForService(service: ServiceName): Promise<ServiceHealthReport> {
    const existing = this.reports.get(service);
    if (!connectionManager.isServiceConfigured(service)) {
      const updated: ServiceHealthReport = {
        service,
        name: existing?.name || service,
        status: 'Disconnected',
        latencyMs: 0,
        lastSync: new Date().toLocaleTimeString(),
        errorLog: ['Credentials required'],
      };
      this.reports.set(service, updated);
      this.notify();
      return updated;
    }

    let testRes: { success: boolean; latencyMs: number; message: string; error?: string } = { success: false, latencyMs: 0, message: 'Check failed', error: 'Unknown error' };

    switch (service) {
      case 'gemini': testRes = await geminiService.testConnection(); break;
      case 'whatsapp': testRes = await whatsAppService.testConnection(); break;
      case 'livekit': testRes = await liveKitService.testConnection(); break;
      case 'google_sheets': testRes = await googleSheetsService.testConnection(); break;
      case 'telegram': testRes = await telegramService.testConnection(); break;
      case 'smtp': testRes = await emailService.testConnection(); break;
    }

    let status: HealthStatus = testRes.success ? 'Connected' : 'Error';
    if (testRes.message === 'Rate limited') status = 'Rate limited';

    const currentLogs = existing?.errorLog || [];
    const newLogs = testRes.error ? [...currentLogs.slice(-4), `[${new Date().toLocaleTimeString()}] ${testRes.error}`] : currentLogs;

    const updated: ServiceHealthReport = {
      service,
      name: existing?.name || service,
      status,
      latencyMs: testRes.latencyMs,
      lastSync: new Date().toLocaleTimeString(),
      errorLog: newLogs,
    };

    this.reports.set(service, updated);
    this.notify();
    return updated;
  }

  public async runAllHealthChecks(): Promise<void> {
    const services: ServiceName[] = ['gemini', 'whatsapp', 'livekit', 'google_sheets', 'telegram', 'smtp'];
    for (const s of services) {
      await this.runHealthCheckForService(s);
    }
  }

  private startHealthCheckLoop() {
    this.runAllHealthChecks();
    setInterval(() => {
      this.runAllHealthChecks();
    }, 60000); // Every 60 seconds
  }
}

export const healthCheckService = HealthCheckService.getInstance();
