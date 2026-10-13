import { ecosystemDb, NotificationRecord } from '../shared/database/EcosystemDatabase';

export class NotificationService {
  private static instance: NotificationService;
  private telegramBotToken = localStorage.getItem('jarvis_telegram_token') || '';
  private telegramChatId = localStorage.getItem('jarvis_telegram_chat_id') || '';

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public getNotifications(): NotificationRecord[] {
    return ecosystemDb.getNotifications();
  }

  public async sendTelegramAlert(title: string, message: string): Promise<NotificationRecord> {
    const record: NotificationRecord = {
      id: `NOTIF-${Date.now()}`,
      channel: 'telegram',
      title,
      message,
      status: this.telegramBotToken && this.telegramChatId ? 'sent' : 'failed',
      timestamp: new Date().toISOString(),
    };

    if (this.telegramBotToken && this.telegramChatId) {
      try {
        await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.telegramChatId,
            text: `🔥 [${title}]\n${message}`,
          }),
        });
        record.status = 'sent';
      } catch (e) {
        record.status = 'failed';
        console.error('[NotificationService] Telegram dispatch error:', e);
      }
    }

    ecosystemDb.saveNotification(record);
    return record;
  }
}

export const notificationService = NotificationService.getInstance();
