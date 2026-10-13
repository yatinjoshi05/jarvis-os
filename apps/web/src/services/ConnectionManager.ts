export interface ServiceCredentials {
  geminiApiKey?: string;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
  whatsappVerifyToken?: string;
  livekitUrl?: string;
  livekitApiKey?: string;
  livekitApiSecret?: string;
  googleSheetId?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;
}

export type ServiceName = 'gemini' | 'whatsapp' | 'livekit' | 'google_sheets' | 'telegram' | 'smtp';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private storageKey = 'jarvis_encrypted_credentials';

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  private simpleEncrypt(str: string): string {
    if (!str) return '';
    return btoa(encodeURIComponent(str).split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ ((i % 5) + 1))
    ).join(''));
  }

  private simpleDecrypt(str: string): string {
    if (!str) return '';
    try {
      const decoded = atob(str);
      return decodeURIComponent(decoded.split('').map((c, i) =>
        String.fromCharCode(c.charCodeAt(0) ^ ((i % 5) + 1))
      ).join(''));
    } catch {
      return str;
    }
  }

  public getCredentials(): ServiceCredentials {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const decrypted = raw ? JSON.parse(this.simpleDecrypt(raw)) : {};

      const env = (import.meta as any).env || {};

      return {
        geminiApiKey: decrypted.geminiApiKey || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '',
        whatsappAccessToken: decrypted.whatsappAccessToken || env.VITE_WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN || '',
        whatsappPhoneNumberId: decrypted.whatsappPhoneNumberId || env.VITE_WHATSAPP_PHONE_NUMBER_ID || env.WHATSAPP_PHONE_NUMBER_ID || '',
        whatsappVerifyToken: decrypted.whatsappVerifyToken || env.VITE_WHATSAPP_VERIFY_TOKEN || env.WHATSAPP_VERIFY_TOKEN || '',
        livekitUrl: decrypted.livekitUrl || env.VITE_LIVEKIT_URL || env.LIVEKIT_URL || '',
        livekitApiKey: decrypted.livekitApiKey || env.VITE_LIVEKIT_API_KEY || env.LIVEKIT_API_KEY || '',
        livekitApiSecret: decrypted.livekitApiSecret || env.VITE_LIVEKIT_API_SECRET || env.LIVEKIT_API_SECRET || '',
        googleSheetId: decrypted.googleSheetId || env.VITE_GOOGLE_SHEET_ID || env.GOOGLE_SHEET_ID || '',
        googleClientId: decrypted.googleClientId || env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '',
        googleClientSecret: decrypted.googleClientSecret || env.VITE_GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET || '',
        telegramBotToken: decrypted.telegramBotToken || env.VITE_TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || '',
        telegramChatId: decrypted.telegramChatId || env.VITE_TELEGRAM_CHAT_ID || env.TELEGRAM_CHAT_ID || '',
        smtpHost: decrypted.smtpHost || env.VITE_SMTP_HOST || env.SMTP_HOST || '',
        smtpPort: decrypted.smtpPort || env.VITE_SMTP_PORT || env.SMTP_PORT || '',
        smtpUser: decrypted.smtpUser || env.VITE_SMTP_USER || env.SMTP_USER || '',
        smtpPassword: decrypted.smtpPassword || env.VITE_SMTP_PASSWORD || env.SMTP_PASSWORD || '',
        smtpFrom: decrypted.smtpFrom || env.VITE_SMTP_FROM || env.SMTP_FROM || '',
      };
    } catch {
      return {};
    }
  }

  public saveCredentials(update: Partial<ServiceCredentials>): ServiceCredentials {
    const current = this.getCredentials();
    const merged = { ...current, ...update };
    const encrypted = this.simpleEncrypt(JSON.stringify(merged));
    localStorage.setItem(this.storageKey, encrypted);
    return merged;
  }

  public isServiceConfigured(service: ServiceName): boolean {
    const creds = this.getCredentials();
    switch (service) {
      case 'gemini':
        return Boolean(creds.geminiApiKey);
      case 'whatsapp':
        return Boolean(creds.whatsappAccessToken && creds.whatsappPhoneNumberId);
      case 'livekit':
        return Boolean(creds.livekitUrl && creds.livekitApiKey);
      case 'google_sheets':
        return Boolean(creds.googleSheetId);
      case 'telegram':
        return Boolean(creds.telegramBotToken && creds.telegramChatId);
      case 'smtp':
        return Boolean(creds.smtpHost && creds.smtpUser);
      default:
        return false;
    }
  }

  public getMaskedKey(service: ServiceName): string {
    const creds = this.getCredentials();
    let val = '';
    switch (service) {
      case 'gemini': val = creds.geminiApiKey || ''; break;
      case 'whatsapp': val = creds.whatsappAccessToken || ''; break;
      case 'livekit': val = creds.livekitApiKey || ''; break;
      case 'google_sheets': val = creds.googleSheetId || ''; break;
      case 'telegram': val = creds.telegramBotToken || ''; break;
      case 'smtp': val = creds.smtpUser || ''; break;
    }

    if (!val) return 'Not Configured';
    if (val.length <= 8) return '••••' + val.slice(-2);
    return val.slice(0, 4) + '••••••••' + val.slice(-4);
  }
}

export const connectionManager = ConnectionManager.getInstance();
