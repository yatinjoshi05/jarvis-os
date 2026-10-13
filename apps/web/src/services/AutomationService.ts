import { ecosystemDb, AutomationNodeRecord, TaskRecord } from '../shared/database/EcosystemDatabase';

export class AutomationService {
  private static instance: AutomationService;

  private constructor() {
    this.initDefaultNodes();
  }

  public static getInstance(): AutomationService {
    if (!AutomationService.instance) {
      AutomationService.instance = new AutomationService();
    }
    return AutomationService.instance;
  }

  private initDefaultNodes() {
    const existing = ecosystemDb.getAutomations();
    if (existing.length === 0) {
      const defaultNodes: AutomationNodeRecord[] = [
        { id: 'n-lead-trigger', name: 'Inbound Lead Webhook', status: 'ONLINE', latency_ms: 12, error_count: 0, tokens_used: 0, memory_bytes: 1048576, logs: ['[Webhook] Listening on /inbound-lead'] },
        { id: 'n-lead-ai', name: 'Lead Analyzer (Gemini)', status: 'ONLINE', latency_ms: 184, error_count: 0, tokens_used: 14200, memory_bytes: 4194304, logs: ['[Gemini] Model gemini-2.0-flash ready'] },
        { id: 'n-lead-sheet', name: 'Leads Sheet (Google Sheets)', status: 'ONLINE', latency_ms: 65, error_count: 0, tokens_used: 0, memory_bytes: 2097152, logs: ['[Sheets] Synced tab Leads'] },
        { id: 'n-lead-hot', name: 'Hot Lead Alert (Telegram)', status: 'ONLINE', latency_ms: 45, error_count: 0, tokens_used: 0, memory_bytes: 524288, logs: ['[Telegram] Bot channel connected'] },
        { id: 'n-lead-call', name: 'Outbound Call Agent (LiveKit)', status: 'ONLINE', latency_ms: 95, error_count: 0, tokens_used: 3200, memory_bytes: 8388608, logs: ['[LiveKit] WebRTC sip trunk ready'] },
        { id: 'n-wa-trigger', name: 'WhatsApp Webhook', status: 'ONLINE', latency_ms: 15, error_count: 0, tokens_used: 0, memory_bytes: 1048576, logs: ['[WhatsApp] Webhook endpoint active'] },
        { id: 'n-wa-ai', name: 'WA Reply Gen (Gemini)', status: 'ONLINE', latency_ms: 160, error_count: 0, tokens_used: 9800, memory_bytes: 4194304, logs: ['[Gemini] Natural reply engine operational'] },
        { id: 'n-email-trigger', name: 'Email Support Webhook', status: 'ONLINE', latency_ms: 18, error_count: 0, tokens_used: 0, memory_bytes: 1048576, logs: ['[Email] IMAP listener connected'] },
        { id: 'n-voice-trigger', name: 'Call Event Webhook', status: 'ONLINE', latency_ms: 22, error_count: 0, tokens_used: 0, memory_bytes: 1048576, logs: ['[Voice] Webhook endpoint listening'] },
        { id: 'n-sched-trigger', name: 'Scheduler Engine', status: 'ONLINE', latency_ms: 5, error_count: 0, tokens_used: 0, memory_bytes: 1048576, logs: ['[Cron] Active schedules running'] },
      ];
      defaultNodes.forEach((node) => ecosystemDb.saveAutomationNode(node));
    }
  }

  public getNodeMetrics(nodeId: string): AutomationNodeRecord | null {
    const nodes = ecosystemDb.getAutomations();
    return nodes.find((n) => n.id === nodeId) || null;
  }

  public recordNodeExecution(nodeId: string, latencyMs: number, tokens = 0, error?: string): void {
    const node = this.getNodeMetrics(nodeId);
    if (!node) return;

    const updated: AutomationNodeRecord = {
      ...node,
      latency_ms: latencyMs,
      tokens_used: node.tokens_used + tokens,
      error_count: error ? node.error_count + 1 : node.error_count,
      status: error ? 'ERROR' : 'ONLINE',
      logs: error ? [...node.logs, `[ERROR ${new Date().toLocaleTimeString()}] ${error}`] : [...node.logs, `[EXEC ${new Date().toLocaleTimeString()}] Completed in ${latencyMs}ms`],
    };
    ecosystemDb.saveAutomationNode(updated);
  }

  public getTasks(): TaskRecord[] {
    return ecosystemDb.getTasks();
  }

  public scheduleTask(title: string, cron?: string): TaskRecord {
    const task: TaskRecord = {
      id: `TASK-${Date.now()}`,
      title,
      cron,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    ecosystemDb.saveTask(task);
    return task;
  }
}

export const automationService = AutomationService.getInstance();
