import { connectionManager } from './ConnectionManager';
import { aiRouter } from '../shared/ai/AIRouter';

export interface TestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  error?: string;
}

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async testConnection(): Promise<TestResult> {
    const start = Date.now();
    const isConfigured = connectionManager.isServiceConfigured('gemini');

    if (!isConfigured) {
      return {
        success: false,
        latencyMs: 0,
        message: 'Credentials required',
        error: 'Missing GEMINI_API_KEY in environment or Integration Center settings.',
      };
    }

    try {
      const response = await aiRouter.generateResponse('Hello');
      const latencyMs = Date.now() - start;

      if (response && response.trim().length > 0) {
        return {
          success: true,
          latencyMs,
          message: `AI Response received: "${response.slice(0, 40)}..."`,
        };
      }

      return {
        success: false,
        latencyMs,
        message: 'Connection failed',
        error: 'Empty response returned from Gemini API.',
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        message: 'Connection failed',
        error: err?.message || 'Failed to reach Gemini API endpoint.',
      };
    }
  }
}

export const geminiService = GeminiService.getInstance();
