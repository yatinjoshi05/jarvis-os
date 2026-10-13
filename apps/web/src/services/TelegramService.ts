import { connectionManager } from './ConnectionManager';
import { TestResult } from './GeminiService';

export class TelegramService {
  private static instance: TelegramService;

  private constructor() {}

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public async testConnection(): Promise<TestResult> {
    const start = Date.now();
    const creds = connectionManager.getCredentials();

    if (!creds.telegramBotToken || !creds.telegramChatId) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Credentials required',
        error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in configuration.',
      };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${creds.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: creds.telegramChatId,
          text: '⚡ JARVIS connected. Integration operational.',
        }),
      });
      const latencyMs = Date.now() - start;

      if (res.ok) {
        return {
          success: true,
          latencyMs,
          message: 'Telegram alert "JARVIS connected" dispatched successfully.',
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 429) {
          return {
            success: false,
            latencyMs,
            message: 'Rate limited',
            error: 'Telegram Bot API rate limit reached. Please wait before retrying.',
          };
        }
        return {
          success: false,
          latencyMs,
          message: 'Connection failed',
          error: errJson?.description || `HTTP ${res.status} ${res.statusText}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'Connection failed',
        error: err?.message || 'Failed to communicate with Telegram servers.',
      };
    }
  }
}

export const telegramService = TelegramService.getInstance();
