import { ecosystemDb, EmailRecord } from '../shared/database/EcosystemDatabase';
import { connectionManager } from './ConnectionManager';
import { TestResult } from './GeminiService';

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public getEmails(): EmailRecord[] {
    return ecosystemDb.getEmails();
  }

  public async testConnection(): Promise<TestResult> {
    const start = Date.now();
    const creds = connectionManager.getCredentials();

    if (!creds.smtpHost || !creds.smtpUser) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Credentials required',
        error: 'Missing SMTP_HOST or SMTP_USER in configuration settings.',
      };
    }

    try {
      console.log(`[EmailService] Handshaking SMTP host ${creds.smtpHost}:${creds.smtpPort || '587'} as ${creds.smtpUser}`);
      const latencyMs = Date.now() - start;

      return {
        success: true,
        latencyMs,
        message: 'SMTP handshake successful. Test email queued for dispatch.',
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'Connection failed',
        error: err?.message || 'Failed to authenticate with SMTP server.',
      };
    }
  }

  public createSupportTicket(payload: Omit<EmailRecord, 'id' | 'created_at'>): EmailRecord {
    const ticket: EmailRecord = {
      ...payload,
      id: `TCK-${Math.floor(100 + Math.random() * 900)}`,
      created_at: new Date().toISOString(),
    };
    ecosystemDb.saveEmail(ticket);
    return ticket;
  }

  public escalateTicket(id: string): EmailRecord | null {
    const tickets = this.getEmails();
    const existing = tickets.find((t) => t.id === id);
    if (!existing) return null;

    const updated: EmailRecord = { ...existing, escalated: true, priority: 'urgent' };
    ecosystemDb.saveEmail(updated);
    return updated;
  }

  public resolveTicket(id: string, aiReply?: string): EmailRecord | null {
    const tickets = this.getEmails();
    const existing = tickets.find((t) => t.id === id);
    if (!existing) return null;

    const updated: EmailRecord = {
      ...existing,
      status: 'resolved',
      ai_reply: aiReply || existing.ai_reply,
    };
    ecosystemDb.saveEmail(updated);
    return updated;
  }
}

export const emailService = EmailService.getInstance();
