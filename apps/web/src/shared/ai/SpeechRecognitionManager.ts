import { VOICE_CONFIG } from './config';

export type SpeechEvent = {
  type: 'start' | 'end' | 'error' | 'result' | 'silence_timeout';
  transcript?: string;
  isFinal?: boolean;
  error?: any;
};

export type SpeechListener = (event: SpeechEvent) => void;

class SpeechRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  public transcript = '';
  public listening = false;
  private listeners = new Set<SpeechListener>();
  public supported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  private shouldRestart = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentLanguage = VOICE_CONFIG.recognition.lang;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (!this.supported) return;

    const SpeechRecognitionClass =
      (
        window as typeof window & {
          webkitSpeechRecognition?: new () => SpeechRecognition;
          SpeechRecognition?: new () => SpeechRecognition;
        }
      ).webkitSpeechRecognition ||
      (
        window as typeof window & {
          SpeechRecognition?: new () => SpeechRecognition;
        }
      ).SpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = VOICE_CONFIG.recognition.continuous;
      this.recognition.interimResults = VOICE_CONFIG.recognition.interimResults;
      this.recognition.lang = this.currentLanguage;

      this.recognition.onstart = () => {
        this.listening = true;
        this.resetSilenceTimer();
        this.notify({ type: 'start' });
      };

      this.recognition.onend = () => {
        this.listening = false;
        this.clearSilenceTimer();
        this.notify({ type: 'end' });
        
        if (this.shouldRestart) {
          setTimeout(() => {
            if (this.shouldRestart && !this.listening) {
              this.start();
            }
          }, 300);
        }
      };

      this.recognition.onerror = (e: any) => {
        console.error('[SpeechRecognitionManager] Error event:', e.error, e);
        
        if (e.error === 'no-speech') {
          this.notify({ type: 'silence_timeout' });
        } else {
          this.notify({ type: 'error', error: e });
        }

        if (e.error === 'network') {
          console.warn('[SpeechRecognitionManager] Network issue. Retrying shortly...');
        }
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.resetSilenceTimer();
        let text = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        this.transcript = text;
        this.notify({ type: 'result', transcript: text, isFinal });
      };
    } catch (e) {
      console.error('[SpeechRecognitionManager] Failed to instantiate SpeechRecognition:', e);
    }
  }

  public subscribe(listener: SpeechListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: SpeechEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[SpeechRecognitionManager] Listener callback threw:', err);
      }
    });
  }

  public setLanguage(lang: string) {
    console.log(`[SpeechRecognitionManager] Switching recognition language to: ${lang}`);
    this.currentLanguage = lang;
    if (this.recognition) {
      const wasListening = this.listening;
      this.stop();
      this.recognition.lang = lang;
      if (wasListening) {
        this.start();
      }
    }
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  private resetSilenceTimer() {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.listening) {
        console.log('[SpeechRecognitionManager] Silence timeout exceeded');
        this.notify({ type: 'silence_timeout' });
      }
    }, VOICE_CONFIG.silenceTimeoutMs);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  start() {
    if (!this.recognition) return;
    this.shouldRestart = true;
    if (this.listening) return;

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition start error:', e);
    }
  }

  stop() {
    this.shouldRestart = false;
    this.clearSilenceTimer();
    if (!this.recognition || !this.listening) return;

    try {
      this.recognition.stop();
    } catch (e) {
      console.warn('SpeechRecognition stop error:', e);
    }
  }

  pause() {
    this.stop();
  }

  resume() {
    this.start();
  }

  cancel() {
    this.shouldRestart = false;
    this.clearSilenceTimer();
    if (!this.recognition) return;
    try {
      (this.recognition as any).abort();
      this.listening = false;
    } catch (_) { /* ignore */ }
  }

  clear() {
    this.transcript = '';
  }
}

export const speechRecognitionManager = new SpeechRecognitionManager();
export default speechRecognitionManager;