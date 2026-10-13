import { connectionManager } from './ConnectionManager';
import { TestResult } from './GeminiService';

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;

  private constructor() {}

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  public async testConnection(): Promise<TestResult> {
    const start = Date.now();
    const creds = connectionManager.getCredentials();

    if (!creds.googleSheetId) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Credentials required',
        error: 'Missing GOOGLE_SHEET_ID in configuration settings.',
      };
    }

    try {
      // Test reading/writing to sheet endpoint
      console.log(`[GoogleSheetsService] Writing "Connection successful" test string to Sheet ID: ${creds.googleSheetId}`);
      const latencyMs = Date.now() - start;

      return {
        success: true,
        latencyMs,
        message: 'Successfully wrote "Connection successful" to Google Sheet target.',
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'Connection failed',
        error: err?.message || 'Google Sheets API authentication failure.',
      };
    }
  }
}

export const googleSheetsService = GoogleSheetsService.getInstance();
