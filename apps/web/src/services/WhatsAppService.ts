import { ecosystemDb, MessageRecord } from '../shared/database/EcosystemDatabase';
import { connectionManager } from './ConnectionManager';
import { TestResult } from './GeminiService';

export class WhatsAppService {
  private static instance: WhatsAppService;
  private apiEndpoint = 'https://graph.facebook.com/v18.0';

  private constructor() {}

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public getMessages(): MessageRecord[] {
    return ecosystemDb.getMessages();
  }

  public async testConnection(): Promise<TestResult> {
    const start = Date.now();
    const creds = connectionManager.getCredentials();

    if (!creds.whatsappAccessToken || !creds.whatsappPhoneNumberId) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Credentials required',
        error: 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID.',
      };
    }

    try {
      const res = await fetch(`${this.apiEndpoint}/${creds.whatsappPhoneNumberId}`, {
        headers: { Authorization: `Bearer ${creds.whatsappAccessToken}` },
      });
      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          success: true,
          latencyMs,
          message: 'WhatsApp Business API node verified successfully.',
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          latencyMs,
          message: 'Connection failed',
          error: errJson?.error?.message || `HTTP ${res.status} ${res.statusText}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'Connection failed',
        error: err?.message || 'Network request failed.',
      };
    }
  }

  public async sendWhatsAppMessage(phone: string, text: string): Promise<MessageRecord> {
    const creds = connectionManager.getCredentials();

    const msgRecord: MessageRecord = {
      id: `WA-${Date.now()}`,
      phone,
      name: phone,
      message: text,
      ai_reply: '',
      intent: 'outbound_dispatch',
      direction: 'outbound',
      status: creds.whatsappAccessToken && creds.whatsappPhoneNumberId ? 'sent' : 'failed',
      created_at: new Date().toISOString(),
    };

    if (creds.whatsappAccessToken && creds.whatsappPhoneNumberId) {
      try {
        await fetch(`${this.apiEndpoint}/${creds.whatsappPhoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${creds.whatsappAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: text },
          }),
        });
        msgRecord.status = 'delivered';
      } catch (err) {
        msgRecord.status = 'failed';
        console.error('[WhatsAppService] Send failed:', err);
      }
    }

    ecosystemDb.saveMessage(msgRecord);
    return msgRecord;
  }

  public handleInboundWebhook(payload: { phone: string; name: string; text: string; intent?: string }): MessageRecord {
    const record: MessageRecord = {
      id: `WA-IN-${Date.now()}`,
      phone: payload.phone,
      name: payload.name,
      message: payload.text,
      ai_reply: '',
      intent: payload.intent || 'inquiry',
      direction: 'inbound',
      status: 'received',
      created_at: new Date().toISOString(),
    };
    ecosystemDb.saveMessage(record);
    return record;
  }
}

export const whatsAppService = WhatsAppService.getInstance();
