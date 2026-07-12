import { AIProvider, ProviderRequestOptions } from "./AIProvider";
import { AI_CONFIG } from "./config";
import { retryManager } from "./RetryManager";
import { ErrorManager } from "./ErrorManager";
import { aiLogger } from "./Logger";

export class ClaudeProvider implements AIProvider {
  private abortController: AbortController | null = null;
  public status: 'online' | 'offline' = 'online';

  async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<string> {
    const config = AI_CONFIG.providers.claude;
    if (!config.apiKey) {
      throw ErrorManager.createError('ClaudeProvider', 'API key missing', 401);
    }
    this.abortController = new AbortController();

    try {
      return await retryManager.execute(async () => {
        const messages = this.formatMessages(prompt, options?.history);

        const response = await fetch(`${config.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-html-user-assertions': 'true'
          },
          body: JSON.stringify({
            model: config.model,
            system: options?.context || undefined,
            messages,
            max_tokens: 1024,
            stream: false
          }),
          signal: this.abortController?.signal
        });

        if (!response.ok) {
          throw await this.handleErrorResponse(response);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        if (onChunk && text) {
          onChunk(text);
        }
        return text;
      });
    } catch (error) {
      throw ErrorManager.mapProviderError('ClaudeProvider', error);
    }
  }

  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<void> {
    const config = AI_CONFIG.providers.claude;
    if (!config.apiKey) {
      throw ErrorManager.createError('ClaudeProvider', 'API key missing', 401);
    }
    this.abortController = new AbortController();

    try {
      await retryManager.execute(async () => {
        const messages = this.formatMessages(prompt, options?.history);

        const response = await fetch(`${config.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: config.model,
            system: options?.context || undefined,
            messages,
            max_tokens: 1024,
            stream: true
          }),
          signal: this.abortController?.signal
        });

        if (!response.ok) {
          throw await this.handleErrorResponse(response);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Readable stream not supported');

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

            if (cleanLine.startsWith('data: ')) {
              try {
                const json = JSON.parse(cleanLine.substring(6));
                if (json.type === 'content_block_delta') {
                  const text = json.delta?.text || '';
                  if (text) {
                    onChunk(text);
                  }
                }
              } catch (_) {
                // Ignore parse errors
              }
            }
          }
        }
      });
    } catch (error) {
      throw ErrorManager.mapProviderError('ClaudeProvider', error);
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      aiLogger.info('ClaudeProvider', 'Request cancelled');
    }
  }

  async healthCheck(): Promise<boolean> {
    const config = AI_CONFIG.providers.claude;
    if (!config.apiKey) return false;
    try {
      const response = await fetch(`${config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1
        })
      });
      this.status = response.ok ? 'online' : 'offline';
      return response.ok;
    } catch (_) {
      this.status = 'offline';
      return false;
    }
  }

  private formatMessages(prompt: string, history?: any[]) {
    const messages: any[] = [];
    if (history) {
      for (const msg of history) {
        const role = msg.role === 'assistant' ? 'assistant' : 'user';
        messages.push({ role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: prompt });
    return messages;
  }

  private async handleErrorResponse(response: Response): Promise<Error> {
    try {
      const json = await response.json();
      const message = json.error?.message || response.statusText;
      return { name: 'Error', message, status: response.status } as any;
    } catch (_) {
      return { name: 'Error', message: `HTTP error ${response.status}`, status: response.status } as any;
    }
  }
}
export default ClaudeProvider;
