/**
 * AudioEvents.ts
 * Strongly-typed event bus for JARVIS OS Premium Audio Engine.
 * Allows components to react instantly to audio events without polling.
 */

import { AudioEventPayloads, AudioEventType, AudioEventListener } from './AudioTypes';

export class AudioEventEmitter {
  private listeners: {
    [K in AudioEventType]?: Set<AudioEventListener<K>>;
  } = {};

  public on<K extends AudioEventType>(event: K, listener: AudioEventListener<K>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }
    (this.listeners[event] as Set<AudioEventListener<K>>).add(listener);

    return () => {
      this.off(event, listener);
    };
  }

  public off<K extends AudioEventType>(event: K, listener: AudioEventListener<K>): void {
    const set = this.listeners[event] as Set<AudioEventListener<K>> | undefined;
    if (set) {
      set.delete(listener);
    }
  }

  public emit<K extends AudioEventType>(event: K, data: AudioEventPayloads[K]): void {
    const set = this.listeners[event] as Set<AudioEventListener<K>> | undefined;
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error(`[AudioEvents] Error in listener for event "${event}":`, err);
        }
      });
    }
  }

  public removeAllListeners(): void {
    this.listeners = {};
  }
}

export const audioEvents = new AudioEventEmitter();
export default audioEvents;
