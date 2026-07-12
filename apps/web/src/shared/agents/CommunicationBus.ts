import { CommunicationMessage } from './types';

type MessageHandler = (message: CommunicationMessage) => void;

class CommunicationBus {
  private handlers = new Map<string, Set<MessageHandler>>();

  public subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)!.add(handler);
    return () => this.unsubscribe(topic, handler);
  }

  public unsubscribe(topic: string, handler: MessageHandler) {
    const set = this.handlers.get(topic);
    if (set) {
      set.delete(handler);
    }
  }

  public broadcast(senderId: string, topic: string, payload: any) {
    const message: CommunicationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId,
      type: 'event',
      topic,
      payload,
      timestamp: Date.now()
    };

    const listeners = this.handlers.get(topic);
    if (listeners) {
      listeners.forEach((handler) => {
        try {
          handler(message);
        } catch (e) {
          console.error(`[CommunicationBus] Error in message handler for topic "${topic}":`, e);
        }
      });
    }
  }

  public send(senderId: string, receiverId: string, topic: string, payload: any) {
    const message: CommunicationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId,
      receiverId,
      type: 'request',
      topic,
      payload,
      timestamp: Date.now()
    };

    const listeners = this.handlers.get(topic);
    if (listeners) {
      listeners.forEach((handler) => {
        try {
          handler(message);
        } catch (e) {
          console.error(`[CommunicationBus] Error in direct handler for topic "${topic}":`, e);
        }
      });
    }
  }
}

export const communicationBus = new CommunicationBus();
export default communicationBus;
