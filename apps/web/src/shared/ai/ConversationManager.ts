import { useState, useEffect } from 'react';
import { assistantState } from './AssistantState';
import { TokenManager } from './TokenManager';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

class ConversationManager {
  public history: Message[] = [];
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('[ConversationManager] Error in listener:', e);
      }
    });
  }

  addSystem(text: string) {
    this.history.push({
      role: 'system',
      content: text,
      timestamp: Date.now(),
    });
    this.notify();
  }

  addUser(text: string) {
    this.history.push({
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });
    this.notify();
  }

  addAssistant(text: string) {
    this.history.push({
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
    });
    this.notify();
  }

  clear() {
    this.history = [];
    assistantState.reset();
    this.notify();
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
      this.notify();
    }
  }

  updateMessage(index: number, content: string) {
    if (this.history[index]) {
      this.history[index].content = content;
      this.history[index].timestamp = Date.now();
      this.notify();
    }
  }

  deleteMessage(index: number) {
    this.history.splice(index, 1);
    this.notify();
  }

  updateMessageAndRegenerate(index: number, content: string, aiResponseManager: any) {
    if (this.history[index]) {
      this.history[index].content = content;
      this.history = this.history.slice(0, index + 1);
      this.notify();
      
      assistantState.transcript = content;
      aiResponseManager.respond();
    }
  }

  regenerate(index: number, aiResponseManager: any) {
    let userMsgIndex = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (this.history[i].role === 'user') {
        userMsgIndex = i;
        break;
      }
    }
    
    if (userMsgIndex !== -1) {
      const userPrompt = this.history[userMsgIndex].content;
      this.history = this.history.slice(0, userMsgIndex + 1);
      this.notify();
      
      assistantState.transcript = userPrompt;
      aiResponseManager.respond();
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
        this.notify();
      }
    } catch (e) {
      console.error('[ConversationManager] Failed to import history:', e);
    }
  }

  trimTokens(maxTokens: number) {
    this.history = TokenManager.trimHistory(this.history, maxTokens) as Message[];
    this.notify();
  }
}

export const conversationManager = new ConversationManager();

export function useConversationHistory() {
  const [history, setHistory] = useState(conversationManager.history);

  useEffect(() => {
    return conversationManager.subscribe(() => {
      setHistory([...conversationManager.history]);
    });
  }, []);

  return history;
}