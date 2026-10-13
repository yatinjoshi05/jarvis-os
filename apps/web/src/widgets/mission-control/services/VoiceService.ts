import { eventBus } from './EventBus';

export type VoiceState = 'Listening' | 'Thinking' | 'Speaking' | 'Muted' | 'Offline';

export interface VoiceServiceStatus {
  state: VoiceState;
  micActive: boolean;
  transcript: string;
  lastCommand: string;
  language: string;
  wakeWordDetected: boolean;
}

export class VoiceService {
  private status: VoiceServiceStatus = {
    state: 'Muted',
    micActive: false,
    transcript: '',
    lastCommand: 'None',
    language: 'English (US)',
    wakeWordDetected: false,
  };

  private listeners: Set<(status: VoiceServiceStatus) => void> = new Set();

  public startListening() {
    this.status = {
      ...this.status,
      state: 'Listening',
      micActive: true,
      wakeWordDetected: true,
      transcript: 'Listening for command...',
    };
    this.notify();
    eventBus.emit('voice detected', { state: 'Listening', wakeWord: true });
  }

  public stopListening() {
    this.status = {
      ...this.status,
      state: 'Muted',
      micActive: false,
      wakeWordDetected: false,
    };
    this.notify();
  }

  public setLanguage(lang: string) {
    this.status = { ...this.status, language: lang };
    this.notify();
  }

  public executeVoiceCommand(commandText: string) {
    const cmd = commandText.trim();
    this.status = {
      ...this.status,
      state: 'Thinking',
      transcript: cmd,
      lastCommand: cmd,
    };
    this.notify();
    eventBus.emit('voice detected', { state: 'Thinking', command: cmd });

    // Parse and execute command intent
    setTimeout(() => {
      this.status = {
        ...this.status,
        state: 'Speaking',
        transcript: `Executing: ${cmd}`,
      };
      this.notify();

      setTimeout(() => {
        this.status = {
          ...this.status,
          state: 'Listening',
          transcript: 'Ready for next command',
        };
        this.notify();
      }, 1500);
    }, 800);
  }

  public getStatus(): VoiceServiceStatus {
    return this.status;
  }

  public subscribe(callback: (status: VoiceServiceStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.status));
  }
}

export const voiceService = new VoiceService();
