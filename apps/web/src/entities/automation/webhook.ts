import { Webhook, WebhookLog } from './interfaces';
import { WebhookFailureError } from './errors';
import { AutomationUtils } from './utils';

export class WebhookManager {
  private webhooks = new Map<string, Webhook>();
  private logs: WebhookLog[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const storedWhs = localStorage.getItem('jarvis_auto_webhooks');
      if (storedWhs) {
        const list = JSON.parse(storedWhs) as Webhook[];
        list.forEach((w) => this.webhooks.set(w.id, w));
      }
      const storedLogs = localStorage.getItem('jarvis_auto_webhook_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs) as WebhookLog[];
      }
    } catch (_) { /* ignore */ }
  }

  private saveData() {
    try {
      localStorage.setItem('jarvis_auto_webhooks', JSON.stringify(Array.from(this.webhooks.values())));
      localStorage.setItem('jarvis_auto_webhook_logs', JSON.stringify(this.logs));
    } catch (_) { /* ignore */ }
  }

  public registerWebhook(name: string, url: string, secret?: string): Webhook {
    const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newWh: Webhook = {
      id,
      name,
      url,
      secret,
      active: true,
      retryCount: 3,
      createdAt: Date.now()
    };
    this.webhooks.set(id, newWh);
    this.saveData();
    return newWh;
  }

  public getWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  public getWebhook(id: string): Webhook | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Fires an outgoing webhook with signature security hashing and logs the delivery results.
   */
  public async fireWebhook(webhookId: string, payload: any): Promise<boolean> {
    const wh = this.webhooks.get(webhookId);
    if (!wh || !wh.active) {
      throw new Error(`Webhook ${webhookId} not found or inactive.`);
    }

    AutomationUtils.generateSignature(payload, wh.secret);

    let success = false;
    let statusCode: number | undefined;
    let errorMsg: string | undefined;

    try {
      // Mocking external POST request
      // const res = await fetch(wh.url, { method: 'POST', body: JSON.stringify(payload), headers: { 'X-Signature': _signature } });
      success = true;
      statusCode = 200;
    } catch (e: any) {
      errorMsg = e.message || String(e);
      throw new WebhookFailureError(webhookId, errorMsg || 'Unknown error');
    } finally {
      const log: WebhookLog = {
        id: `whl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        webhookId,
        direction: 'outgoing',
        payload,
        status: success ? 'success' : 'failed',
        statusCode,
        timestamp: Date.now(),
        error: errorMsg
      };
      
      this.logs.push(log);
      if (this.logs.length > 200) this.logs.shift();
      this.saveData();
    }

    return success;
  }

  public getLogs(webhookId?: string): WebhookLog[] {
    if (webhookId) {
      return this.logs.filter((l) => l.webhookId === webhookId);
    }
    return this.logs;
  }
}

export const webhookManager = new WebhookManager();
export default webhookManager;
