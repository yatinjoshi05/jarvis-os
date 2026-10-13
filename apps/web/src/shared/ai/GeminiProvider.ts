import { AIProvider, ProviderRequestOptions } from "./AIProvider";
import { AI_CONFIG, getBackendApiUrl } from "./config";
import { retryManager } from "./RetryManager";
import { ErrorManager } from "./ErrorManager";
import { identitySettings } from "./IdentitySettings";

export class GeminiProvider implements AIProvider {
  protected abortController: AbortController | null = null;
  public status: 'online' | 'offline' = 'online';

  constructor() {
    this.status = 'online';
  }

  private getApiUrl(): string {
    return getBackendApiUrl('/api/chat/gemini');
  }

  private resolveModel(options?: ProviderRequestOptions): string {
    return options?.model || AI_CONFIG.providers.gemini.model;
  }

  private buildRequestBody(
    prompt: string,
    options?: ProviderRequestOptions
  ): Record<string, unknown> {
    const contents = this.formatContents(prompt, options?.history);
    const body: Record<string, unknown> = { contents };

    const identityDirective = identitySettings.getFormattedSystemInstructions();
    const systemText = options?.context?.trim();
    const fullSystemInstruction = systemText
      ? `${identityDirective}\n\n${systemText}`
      : identityDirective;

    body['system_instruction'] = { parts: [{ text: fullSystemInstruction }] };

    body['generationConfig'] = { maxOutputTokens: AI_CONFIG.maxTokens };
    return body;
  }

  async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<string> {
    this.abortController = new AbortController();
    const model = this.resolveModel(options);
    const body = this.buildRequestBody(prompt, options);

    try {
      return await retryManager.execute(async () => {
        const response = await fetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: false,
            ...body
          }),
          signal: this.abortController?.signal
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '(no body)');
          throw { name: 'GeminiServerError', message: `[GeminiServer] HTTP ${response.status}: ${errText}`, status: response.status, responseBody: errText };
        }

        const json = await response.json() as any;
        const text = (json?.candidates?.[0]?.content?.parts?.[0]?.text as string) || '';
        if (onChunk && text) {
          onChunk(text);
        }
        return text;
      });
    } catch (error) {
      throw ErrorManager.mapProviderError('GeminiProvider', error, this.getApiUrl());
    }
  }

  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<void> {
    this.abortController = new AbortController();
    const model = this.resolveModel(options);
    const body = this.buildRequestBody(prompt, options);

    try {
      await retryManager.execute(async () => {
        const response = await fetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            stream: true,
            ...body
          }),
          signal: this.abortController?.signal
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => '(no body)');
          throw { name: 'GeminiServerError', message: `[GeminiServer] HTTP ${response.status}: ${errText}`, status: response.status, responseBody: errText };
        }
        if (!response.body) throw new Error('[GeminiServer] No response body for streaming');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr) as any;
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (typeof text === 'string' && text) onChunk(text);
            } catch {
              // Malformed SSE line — skip silently
            }
          }
        }
      });
    } catch (error) {
      throw ErrorManager.mapProviderError('GeminiProvider', error, this.getApiUrl());
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AI_CONFIG.providers.gemini.fastModel,
          stream: false,
          contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
          generationConfig: { maxOutputTokens: 1 }
        }),
        signal: AbortSignal.timeout(5000)
      });
      this.status = response.ok ? 'online' : 'offline';
      return response.ok;
    } catch {
      this.status = 'offline';
      return false;
    }
  }

  private formatContents(
    prompt: string,
    history?: Array<{ role: string; content: string }>
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (history) {
      for (const msg of history) {
        if (msg.role === 'system') continue;
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });
    return contents;
  }
}
