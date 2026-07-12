import { assistantState } from './AssistantState';
import { TokenManager } from './TokenManager';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

class ConversationManager {
  public history: Message[] = [];

  addSystem(text: string) {
    this.history.push({
      role: 'system',
      content: text,
      timestamp: Date.now(),
    });
  }

  addUser(text: string) {
    this.history.push({
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });
  }

  addAssistant(text: string) {
    this.history.push({
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.history = [];
    assistantState.reset();
  }

  reset() {
    this.clear();
  }

  latest() {
    return this.history.at(-1);
  }

  removeLatestUserMessage() {
    if (this.latest()?.role === 'user') {
      this.history.pop();
    }
  }

  export(): string {
    return JSON.stringify(this.history, null, 2);
  }

  import(json: string) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        this.history = parsed.map((msg: any) => ({
          role: msg.role === 'system' ? 'system' : msg.role === 'assistant' ? 'assistant' : 'user',
          content: String(msg.content || ''),
          timestamp: Number(msg.timestamp || Date.now())
        }));
      }
    } catch (e) {
      console.error('[ConversationManager] Failed to import history:', e);
    }
  }

  trimTokens(maxTokens: number) {
    this.history = TokenManager.trimHistory(this.history, maxTokens) as Message[];
  }
}

export const conversationManager = new ConversationManager();