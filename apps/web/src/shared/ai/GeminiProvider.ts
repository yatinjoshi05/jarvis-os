import { GoogleGenAI } from "@google/genai";
import { AIProvider, ProviderRequestOptions } from "./AIProvider";
import { AI_CONFIG } from "./config";
import { retryManager } from "./RetryManager";
import { ErrorManager } from "./ErrorManager";
import { aiLogger } from "./Logger";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI | null = null;
  private abortController: AbortController | null = null;
  public status: 'online' | 'offline' = 'online';

  constructor() {
    this.initClient();
  }

  private initClient() {
    const apiKey = AI_CONFIG.providers.gemini.apiKey;
    if (!apiKey) {
      aiLogger.warn('GeminiProvider', 'VITE_GEMINI_API_KEY is missing.');
      this.status = 'offline';
      return;
    }
    try {
      this.client = new GoogleGenAI({ apiKey });
      this.status = 'online';
    } catch (e) {
      aiLogger.error('GeminiProvider', 'Failed to initialize GoogleGenAI client', e);
      this.status = 'offline';
    }
  }

  async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<string> {
    if (!this.client) {
      throw ErrorManager.createError('GeminiProvider', 'Client not initialized', 401);
    }

    this.abortController = new AbortController();

    try {
      return await retryManager.execute(async () => {
        const systemInstruction = options?.context || '';
        const contents = this.formatContents(prompt, options?.history);

        const response = await this.client!.models.generateContent({
          model: AI_CONFIG.providers.gemini.model,
          contents,
          config: {
            systemInstruction: systemInstruction || undefined,
          }
        });

        const text = response.text || '';
        if (onChunk && text) {
          onChunk(text);
        }
        return text;
      });
    } catch (error) {
      throw ErrorManager.mapProviderError('GeminiProvider', error);
    }
  }

  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<void> {
    if (!this.client) {
      throw ErrorManager.createError('GeminiProvider', 'Client not initialized', 401);
    }

    this.abortController = new AbortController();

    try {
      await retryManager.execute(async () => {
        const systemInstruction = options?.context || '';
        const contents = this.formatContents(prompt, options?.history);

        const stream = await this.client!.models.generateContentStream({
          model: AI_CONFIG.providers.gemini.model,
          contents,
          config: {
            systemInstruction: systemInstruction || undefined,
          }
        });

        for await (const chunk of stream) {
          if (this.abortController?.signal.aborted) {
            break;
          }
          const text = chunk.text || '';
          if (text) {
            onChunk(text);
          }
        }
      });
    } catch (error) {
      throw ErrorManager.mapProviderError('GeminiProvider', error);
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      aiLogger.info('GeminiProvider', 'Request cancelled');
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.models.generateContent({
        model: AI_CONFIG.providers.gemini.model,
        contents: 'ping',
      });
      this.status = 'online';
      return true;
    } catch (e) {
      this.status = 'offline';
      return false;
    }
  }

  private formatContents(prompt: string, history?: Array<{ role: string; content: string }>) {
    const contents: any[] = [];
    if (history) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
    return contents;
  }
}
