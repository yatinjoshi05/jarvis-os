import { EmailPayload, WhatsAppPayload, SMSPayload, NotificationPayload } from './interfaces';
import { automationEventEmitter, AutomationEvents } from './events';
import { ProviderUnavailableError } from './errors';
import { AUTOMATION_CONFIG } from './config';
import { templateManager } from './template';
import { notificationManager } from '../../shared/dashboard';

// Abstract Provider Definitions
export interface EmailProvider {
  send(payload: EmailPayload): Promise<boolean>;
}

export interface WhatsAppProvider {
  send(payload: WhatsAppPayload): Promise<boolean>;
}

export interface SMSProvider {
  send(payload: SMSPayload): Promise<boolean>;
}

// Concrete Mock Providers
class MockSMTPProvider implements EmailProvider {
  public async send(payload: EmailPayload): Promise<boolean> {
    payload.isMock = true;
    console.log(`[SIMULATED SMTP Provider] (MOCK EMAIL) Sending email to ${payload.to}. Subject: ${payload.subject}`);
    return true;
  }
}

class MockWhatsAppBusinessProvider implements WhatsAppProvider {
  public async send(payload: WhatsAppPayload): Promise<boolean> {
    payload.isMock = true;
    console.log(`[SIMULATED WhatsApp Provider] (MOCK WHATSAPP) Sending template message to ${payload.phone}`);
    return true;
  }
}

class MockTwilioSMSProvider implements SMSProvider {
  public async send(payload: SMSPayload): Promise<boolean> {
    payload.isMock = true;
    console.log(`[SIMULATED Twilio SMS Provider] (MOCK SMS) Sending SMS to ${payload.phone}: ${payload.message}`);
    return true;
  }
}

// Reusable Communication Services
export class EmailService {
  private provider: EmailProvider = new MockSMTPProvider();

  public setProvider(provider: EmailProvider) {
    this.provider = provider;
  }

  public async sendEmail(payload: EmailPayload): Promise<boolean> {
    if (!AUTOMATION_CONFIG.mockProviders.email.smtp.enabled) {
      throw new ProviderUnavailableError('SMTP', 'Service disabled in config.');
    }

    const finalPayload = { ...payload };
    if (payload.templateId) {
      const rendered = templateManager.render(payload.templateId, payload.templateVars || {});
      finalPayload.subject = rendered.subject || payload.subject;
      finalPayload.html = rendered.body;
    }

    const success = await this.provider.send(finalPayload);
    if (success) {
      automationEventEmitter.emit(AutomationEvents.EMAIL_SENT, finalPayload);
    }
    return success;
  }

  public async sendBulkEmail(payloads: EmailPayload[]): Promise<number> {
    let sentCount = 0;
    for (const p of payloads) {
      try {
        if (await this.sendEmail(p)) sentCount++;
      } catch (_) { /* ignore bulk failure */ }
    }
    return sentCount;
  }
}

export class WhatsAppService {
  private provider: WhatsAppProvider = new MockWhatsAppBusinessProvider();

  public setProvider(provider: WhatsAppProvider) {
    this.provider = provider;
  }

  public async sendWhatsApp(payload: WhatsAppPayload): Promise<boolean> {
    if (!AUTOMATION_CONFIG.mockProviders.whatsapp.businessApi.enabled) {
      throw new ProviderUnavailableError('WhatsApp', 'Business API disabled.');
    }

    const finalPayload = { ...payload };
    if (payload.templateId) {
      const rendered = templateManager.render(payload.templateId, payload.templateVars || {});
      finalPayload.message = rendered.body;
    }

    const success = await this.provider.send(finalPayload);
    if (success) {
      automationEventEmitter.emit(AutomationEvents.WHATSAPP_SENT, finalPayload);
    }
    return success;
  }

  public async sendBulkWhatsApp(payloads: WhatsAppPayload[]): Promise<number> {
    let sentCount = 0;
    for (const p of payloads) {
      try {
        if (await this.sendWhatsApp(p)) sentCount++;
      } catch (_) { /* ignore bulk failure */ }
    }
    return sentCount;
  }
}

export class SMSService {
  private provider: SMSProvider = new MockTwilioSMSProvider();

  public setProvider(provider: SMSProvider) {
    this.provider = provider;
  }

  public async sendSMS(payload: SMSPayload): Promise<boolean> {
    if (!AUTOMATION_CONFIG.mockProviders.sms.twilio.enabled) {
      throw new ProviderUnavailableError('Twilio', 'SMS gateway disabled.');
    }

    const success = await this.provider.send(payload);
    if (success) {
      automationEventEmitter.emit(AutomationEvents.SMS_SENT, payload);
    }
    return success;
  }
}

// Consolidated Notification Engine
export class NotificationEngine {
  private emailService = new EmailService();
  private whatsappService = new WhatsAppService();
  private smsService = new SMSService();

  public async sendNotification(payload: NotificationPayload): Promise<boolean[]> {
    const results: boolean[] = [];

    for (const channel of payload.channels) {
      try {
        let sent = false;
        if (channel === 'in-app' || channel === 'push') {
          notificationManager.showNotification('info', payload.title, payload.message);
          sent = true;
        } else if (channel === 'email') {
          sent = await this.emailService.sendEmail({
            to: 'customer@mockemail.com',
            subject: payload.title,
            text: payload.message
          });
        } else if (channel === 'whatsapp') {
          sent = await this.whatsappService.sendWhatsApp({
            phone: '+15550199',
            message: `${payload.title}: ${payload.message}`
          });
        } else if (channel === 'sms') {
          sent = await this.smsService.sendSMS({
            phone: '+15550199',
            message: `${payload.title}: ${payload.message}`,
            type: 'alert'
          });
        }
        results.push(sent);
      } catch (_) {
        results.push(false);
      }
    }

    automationEventEmitter.emit(AutomationEvents.NOTIFICATION_SENT, payload);
    return results;
  }
}

export const emailService = new EmailService();
export const whatsappService = new WhatsAppService();
export const smsService = new SMSService();
export const notificationEngine = new NotificationEngine();
export default notificationEngine;
