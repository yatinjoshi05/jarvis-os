import { AIProvider, ProviderRequestOptions } from './AIProvider';
import { aiLogger } from './Logger';

declare const process: any;

export interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  modelName: string;
  envVarKey?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
}

export class CustomOpenAICompatibleProvider implements AIProvider {
  private config: CustomProviderConfig;
  private abortController: AbortController | null = null;

  constructor(config: CustomProviderConfig) {
    this.config = config;
  }

  public getConfig(): CustomProviderConfig {
    return { ...this.config };
  }

  public getApiKey(): string {
    const envVarKeyVal = typeof process !== 'undefined' && process.env && this.config.envVarKey ? process.env[this.config.envVarKey] : '';
    const idVal = typeof process !== 'undefined' && process.env ? process.env[this.config.id] : '';
    return envVarKeyVal || idVal || this.config.apiKey || '';
  }

  public isProviderConfigured(): boolean {
    const isLocal = this.config.baseUrl.includes('localhost') || this.config.baseUrl.includes('127.0.0.1');
    return isLocal || !!this.getApiKey();
  }

  public getSupportedModels(): string[] {
    return [this.config.modelName];
  }

  public async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<string> {
    this.abortController = new AbortController();
    const model = options?.model || this.config.modelName;
    const cleanBaseUrl = this.config.baseUrl.replace(/\/+$/, '');
    const url = cleanBaseUrl.endsWith('/chat/completions')
      ? cleanBaseUrl
      : `${cleanBaseUrl}/chat/completions`;

    const apiKey = this.getApiKey();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...(this.config.customHeaders || {}),
    };

    const messages: Array<{ role: string; content: string }> = [];

    if (options?.context) {
      messages.push({ role: 'system', content: options.context });
    }

    if (options?.history && options.history.length > 0) {
      messages.push(...options.history);
    }

    messages.push({ role: 'user', content: prompt });

    const body = {
      model,
      messages,
      stream: false,
    };

    aiLogger.info('CustomOpenAICompatibleProvider', `Request to ${this.config.name} (${model}) at ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '(no body)');
        throw new Error(
          `[CustomProvider:${this.config.name}] API request failed with HTTP ${response.status}: ${errText}`
        );
      }

      const json = await response.json();
      const content =
        json?.choices?.[0]?.message?.content ||
        json?.choices?.[0]?.text ||
        '';

      if (!content) {
        throw new Error(
          `[CustomProvider:${this.config.name}] Received empty completion response from provider.`
        );
      }

      if (onChunk && content) {
        onChunk(content);
      }

      return content;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`[CustomProvider:${this.config.name}] Request was aborted.`);
      }
      aiLogger.error('CustomOpenAICompatibleProvider', `Error executing response for ${this.config.name}`, error);
      throw error;
    }
  }

  public async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<void> {
    await this.generateResponse(prompt, onChunk, options);
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const res = await this.generateResponse('ping');
      return !!res;
    } catch (_) {
      return false;
    }
  }
}

export default CustomOpenAICompatibleProvider;
