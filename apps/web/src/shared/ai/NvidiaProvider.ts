import { AIProvider, ProviderRequestOptions } from "./AIProvider";
import { AI_CONFIG, getBackendApiUrl } from "./config";
import { retryManager } from "./RetryManager";
import { ErrorManager } from "./ErrorManager";
import { identitySettings } from "./IdentitySettings";

export class NvidiaProvider implements AIProvider {
  protected abortController: AbortController | null = null;
  public status: 'online' | 'offline' = 'online';

  private getApiKey(): string {
    return AI_CONFIG.providers.nvidia.apiKey || '';
  }

  private getApiUrl(): string {
    return getBackendApiUrl('/api/chat/nvidia');
  }

  private getModelsUrl(): string {
    return getBackendApiUrl('/api/models/nvidia');
  }

  async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<string> {
    this.abortController = new AbortController();

    try {
      return await retryManager.execute(async () => {
        const messages = this.formatMessages(prompt, options?.context, options?.history);
        const resolvedModel = options?.model || AI_CONFIG.providers.nvidia.model;

        console.log(`[NVIDIA] Full Request URL: ${AI_CONFIG.providers.nvidia.baseUrl}/chat/completions`);
        console.log(`[NVIDIA] Model: ${resolvedModel}`);
        console.log(`[NVIDIA] Endpoint: /chat/completions`);

        let response: Response;
        try {
          response = await fetch(this.getApiUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: resolvedModel,
              messages,
              stream: false
            }),
            signal: this.abortController?.signal
          });
        } catch (_) {
          response = new Response(null, { status: 502, statusText: 'Proxy Failed' });
        }

        if (!response.ok && (response.status === 404 || response.status === 502) && this.getApiKey()) {
          console.warn(`[NVIDIA] Local backend proxy returned HTTP ${response.status}. Falling back to direct NVIDIA API...`);
          response = await fetch(`${AI_CONFIG.providers.nvidia.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getApiKey()}`
            },
            body: JSON.stringify({
              model: resolvedModel,
              messages,
              stream: false
            }),
            signal: this.abortController?.signal
          });
        }

        console.log(`[NVIDIA] Status Code: ${response.status}`);

        if (!response.ok) {
          console.error(`[NVIDIA] Response: Failed (Status ${response.status})`);
          this.status = 'offline';
          throw await this.handleErrorResponse(response);
        }

        console.log(`[NVIDIA] Response: Success (HTTP 200 OK)`);
        this.status = 'online';

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (onChunk && text) {
          onChunk(text);
        }
        return text;
      });
    } catch (error) {
      this.status = 'offline';
      throw ErrorManager.mapProviderError('NvidiaProvider', error, this.getApiUrl());
    }
  }

  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      await retryManager.execute(async () => {
        const messages = this.formatMessages(prompt, options?.context, options?.history);
        const resolvedModel = options?.model || AI_CONFIG.providers.nvidia.model;

        console.log(`[NVIDIA] Full Request URL: ${AI_CONFIG.providers.nvidia.baseUrl}/chat/completions (Stream)`);
        console.log(`[NVIDIA] Model: ${resolvedModel}`);
        console.log(`[NVIDIA] Endpoint: /chat/completions`);

        let response: Response;
        try {
          response = await fetch(this.getApiUrl(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: resolvedModel,
              messages,
              stream: true
            }),
            signal: this.abortController?.signal
          });
        } catch (_) {
          response = new Response(null, { status: 502, statusText: 'Proxy Failed' });
        }

        if (!response.ok && (response.status === 404 || response.status === 502) && this.getApiKey()) {
          console.warn(`[NVIDIA] Local backend proxy stream returned HTTP ${response.status}. Falling back to direct NVIDIA API...`);
          response = await fetch(`${AI_CONFIG.providers.nvidia.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getApiKey()}`
            },
            body: JSON.stringify({
              model: resolvedModel,
              messages,
              stream: true
            }),
            signal: this.abortController?.signal
          });
        }

        console.log(`[NVIDIA] Status Code: ${response.status}`);

        if (!response.ok) {
          console.error(`[NVIDIA] Response: Failed (Status ${response.status})`);
          this.status = 'offline';
          throw await this.handleErrorResponse(response);
        }

        console.log(`[NVIDIA] Response: Streaming Started (HTTP 200 OK)`);
        this.status = 'online';

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Readable stream not supported');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            if (cleanLine === 'data: [DONE]') continue;

            if (cleanLine.startsWith('data: ')) {
              try {
                const json = JSON.parse(cleanLine.substring(6));
                const text = json.choices?.[0]?.delta?.content || '';
                if (text) {
                  onChunk(text);
                }
              } catch (_) {
                // Ignore parse errors
              }
            }
          }
        }
      });
    } catch (error) {
      this.status = 'offline';
      throw ErrorManager.mapProviderError('NvidiaProvider', error, this.getApiUrl());
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
      // 1. Try local proxy models health check
      let response = await fetch(this.getModelsUrl(), {
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!response || !response.ok) {
        // 2. Try POST ping if GET /models endpoint is unavailable
        response = await fetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: AI_CONFIG.providers.nvidia.model,
            messages: [{ role: 'user', content: 'ping' }],
            stream: false
          }),
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
      }

      if (!response || !response.ok) {
        // 3. Try direct API models check if key exists
        if (this.getApiKey()) {
          response = await fetch(`${AI_CONFIG.providers.nvidia.baseUrl}/models`, {
            headers: { Authorization: `Bearer ${this.getApiKey()}` },
            signal: AbortSignal.timeout(5000)
          }).catch(() => null);
        }
      }

      const isOk = Boolean(response && response.ok);
      this.status = isOk ? 'online' : 'offline';
      return isOk;
    } catch (_) {
      this.status = 'offline';
      return false;
    }
  }

  protected formatMessages(prompt: string, context?: string, history?: any[]) {
    const messages: any[] = [];
    const identityDirectives = identitySettings.getFormattedSystemInstructions();
    const finalContext = context
      ? (context.includes('SYSTEM MANDATE') ? context : `${identityDirectives}\n\n${context}`)
      : identityDirectives;

    messages.push({ role: 'system', content: finalContext });
    if (history) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: prompt });
    return messages;
  }

  private async handleErrorResponse(response: Response): Promise<Error> {
    try {
      const json = await response.json();
      const message = json.error?.message || json.error || response.statusText;
      return { name: 'Error', message, status: response.status, responseBody: json } as any;
    } catch (_) {
      return { name: 'Error', message: `HTTP error ${response.status}`, status: response.status } as any;
    }
  }
}
