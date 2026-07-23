import { AIProvider, ProviderRequestOptions } from "./AIProvider";
import { AI_CONFIG } from "./config";
import { retryManager } from "./RetryManager";
import { ErrorManager } from "./ErrorManager";
import { aiLogger } from "./Logger";

export class LocalProvider implements AIProvider {
  private abortController: AbortController | null = null;
  public status: 'online' | 'offline' = 'online';

  async generateResponse(
    prompt: string,
    onChunk?: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<string> {
    const config = AI_CONFIG.providers.local;
    this.abortController = new AbortController();

    try {
      return await retryManager.execute(async () => {
        const messages = this.formatMessages(prompt, options?.context, options?.history);

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            stream: false
          }),
          signal: this.abortController?.signal
        });

        if (!response.ok) {
          throw new Error(`Local provider HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (onChunk && text) {
          onChunk(text);
        }
        return text;
      });
    } catch (error) {
      throw ErrorManager.mapProviderError('LocalProvider', error, config.baseUrl);
    }
  }

  async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: ProviderRequestOptions
  ): Promise<void> {
    const config = AI_CONFIG.providers.local;
    this.abortController = new AbortController();

    try {
      await retryManager.execute(async () => {
        const messages = this.formatMessages(prompt, options?.context, options?.history);

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: config.model,
            messages,
            stream: true
          }),
          signal: this.abortController?.signal
        });

        if (!response.ok) {
          throw new Error(`Local provider HTTP Error: ${response.status}`);
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
      throw ErrorManager.mapProviderError('LocalProvider', error, config.baseUrl);
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      aiLogger.info('LocalProvider', 'Request cancelled');
    }
  }

  async healthCheck(): Promise<boolean> {
    const config = AI_CONFIG.providers.local;
    try {
      const response = await fetch(`${config.baseUrl}/models`, {
        signal: AbortSignal.timeout(3000)
      });
      this.status = response.ok ? 'online' : 'offline';
      return response.ok;
    } catch (_) {
      this.status = 'offline';
      return false;
    }
  }

  private formatMessages(prompt: string, context?: string, history?: any[]) {
    const messages: any[] = [];
    if (context) {
      messages.push({ role: 'system', content: context });
    }
    if (history) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: prompt });
    return messages;
  }
}
export default LocalProvider;
